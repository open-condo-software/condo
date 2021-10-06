const faker = require('faker')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries.js')
const { MULTIPLE_ACCOUNTS_MATCHES } = require('@condo/domains/user/constants/errors')
const { getItems, createItem, updateItem } = require('@keystonejs/server-side-graphql-client')
const { TokenSet: TokenSetAPI } = require('@condo/domains/organization/utils/serverSchema')
const { createConfirmedEmployee } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { uniqBy, get } = require('lodash')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { SBBOL_IMPORT_NAME } = require('./common')
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 // its real TTL is 180 days bit we need to update it earlier
const {
    REGISTER_NEW_ORGANIZATION_MUTATION,
} = require('@condo/domains/organization/gql.js')
const {
    CREATE_ONBOARDING_MUTATION,
} = require('@condo/domains/onboarding/gql.js')


class SbbolOrganization {
    constructor ({ keystone, userInfo }){
        this.keystone = keystone
        this.organization = null
        this.user = null
        this.dvSenderFields = {
            dv: 1,
            sender: { dv: 1, fingerprint: `import-${SBBOL_IMPORT_NAME}` },
        }
        this.organizationInfo = {
            ...this.dvSenderFields,
            name: userInfo.OrgName,
            country: RUSSIA_COUNTRY,
            meta: {
                inn: userInfo.inn,
                kpp: userInfo.orgKpp,
                ogrn: userInfo.orgOgrn,
                address: userInfo.orgJuridicalAddress,
                fullname: userInfo.orgFullName,
                bank: userInfo.terBank,
            },
            importRemoteSystem: SBBOL_IMPORT_NAME,
            importId: userInfo.HashOrgId, // TODO(zuch): we have no access to orgId field from sbbol
        }
        if (!userInfo.phone_number.startsWith('+')) {
            userInfo.phone_number = `+${userInfo.phone_number}`
        }
        this.userInfo = {
            ...this.dvSenderFields,
            name: userInfo.OrgName, // TODO(zuch): we have no access to user name field from sbbol
            importId: userInfo.userGuid,
            importRemoteSystem: SBBOL_IMPORT_NAME,
            email: userInfo.email,
            phone: normalizePhone(userInfo.phone_number),
            isPhoneVerified: true,
            isEmailVerified: true,
            password: faker.internet.password(),
        }
    }

    async init () {
        this.adminContext = await this.keystone.createContext({ skipAccessControl: true })
    }

    get context () {
        return ({
            keystone: this.keystone,
            context: this.adminContext,
        })
    }

    get organization () {
        return this._organization
    }

    set organization (value) {
        this._organization = value
    }

    async syncUser () {
        const importFields = {
            importId: this.userInfo.importId,
            importRemoteSystem: this.userInfo.importRemoteSystem,
        }
        const existingUsers = await getItems({ ...this.context, listKey: 'User', where: {
            OR: [
                { phone: this.userInfo.phone },
                { AND: importFields },
            ],
        } })
        if (existingUsers.length > 1) {
            throw new Error(`${MULTIPLE_ACCOUNTS_MATCHES}] importId and phone conflict on user import`)
        }
        if (existingUsers.length === 0) {
            this.user = await createItem({ listKey: 'User', item: this.userInfo, returnFields: 'id phone name', ...this.context })
            await this.createOnboarding()
            return
        }
        const [user] = existingUsers
        if (!user.importId) {
            const { email, phone } = this.userInfo
            const update = {}
            if (!user.isEmailVerified && user.email === email) {
                update.isEmailVerified = true
            }
            if (!user.isPhoneVerified && user.phone === phone) {
                update.isPhoneVerified = true
            }
            if (!user.email) {
                user.email = email
            }
            this.user = await updateItem({ listKey: 'User', item: {
                id: user.id,
                data: {
                    ...update,
                    ...importFields,
                },
            }, returnFields: 'id', ...this.context })
            return
        }
        this.user = user
    }

    async getUserOrganizations () {
        const links = await getItems({ ...this.context, listKey: 'OrganizationEmployee', where: {
            user: { id: this.user.id },
        }, returnFields: 'organization { id meta }' })
        return uniqBy(links.map(link => link.organization), 'id')
    }

    async syncOrganization () {
        const importInfo = {
            importId: this.organizationInfo.importId,
            importRemoteSystem: this.organizationInfo.importRemoteSystem,
        }
        const userOrganizations = await this.getUserOrganizations()
        const [organization] = await getItems({ ...this.context, returnFields: 'id country', listKey: 'Organization', where: importInfo })
        if (!organization) {
            // we need to check if user has registered organization with a same tin
            const existingOrganization = userOrganizations.find(organization => organization.meta.inn === this.organizationInfo.meta.inn)
            if (existingOrganization) {
                await updateItem({ listKey: 'Organization', item: {
                    id: existingOrganization.id,
                    data: {
                        ...importInfo,
                        meta: {
                            ...existingOrganization.meta,
                            ...this.organizationInfo.meta,
                        },
                    },
                }, returnFields: 'id', ...this.context })
                this._organization = existingOrganization
                return
            }
            this._organization = await this.createOrganization()
        } else  {
            this._organization = organization
            const isAlreadyEmployee = userOrganizations.find(org => org.id === organization.id)
            if (isAlreadyEmployee) {
                return
            }
            const allRoles = await getItems({ ...this.context, listKey: 'OrganizationEmployeeRole', where: {
                organization: {
                    id: organization.id,
                },
                name: 'employee.role.Administrator.name',
            }, returnFields: 'id' })
            await createConfirmedEmployee(this.adminContext, organization, {
                ...this.userInfo,
                ...this.user,
            }, allRoles[0], this.dvSenderFields)
        }
    }

    async getOrganizationEmployeeLinkId () {
        const [link] = await getItems({ ...this.context, listKey: 'OrganizationEmployee', where: {
            user: { id: this.user.id },
            organization: { id: this._organization.id },
        }, returnFields: 'id' })
        if (!link) {
            throw new Error('Failed to bind user to organization')
        }
        return link.id
    }

    async updateTokens (info) {
        const { access_token, expires_at, refresh_token } = info
        const owner = {
            organization: {
                id: get(this._organization, 'id'),
            },
            user: {
                id: get(this.user, 'id'),
            },
        }
        const connectOwner = {
            organization: {
                connect: { id: owner.organization.id },
            },
            user: {
                connect: { id: owner.user.id },
            },
        }
        const [currentTokenSet] = await getItems({ ...this.context, listKey: 'TokenSet', where: { ...owner }, returnFields: 'id' })
        const item = {
            ...this.dvSenderFields,
            importRemoteSystem: SBBOL_IMPORT_NAME,
            accessToken: access_token,
            refreshToken: refresh_token,
            accessTokenExpiresAt: new Date(Date.now() + expires_at).toISOString(),
            refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString(),
        }
        if (currentTokenSet) {
            await TokenSetAPI.update(this.adminContext, currentTokenSet.id, item)
        } else {
            await TokenSetAPI.create(this.adminContext, { ...connectOwner, ...item })
        }
    }

    async createOnboarding () {
        const userContext = await this.keystone.createContext({
            authentication: {
                item: this.user,
                listKey: 'User',
            },
        })
        await userContext.executeGraphQL({
            context: userContext,
            query: CREATE_ONBOARDING_MUTATION,
            variables: {
                data: {
                    ...this.dvSenderFields,
                    type: 'ADMINISTRATOR',
                    userId: this.user.id,
                },
            },
        })
    }

    async createOrganization () {
        const importInfo = {
            importId: this.organizationInfo.importId,
            importRemoteSystem: this.organizationInfo.importRemoteSystem,
        }
        const userContext = await this.keystone.createContext({
            authentication: {
                item: this.user,
                listKey: 'User',
            },
        })
        const { data } = await userContext.executeGraphQL({
            context: userContext,
            query: REGISTER_NEW_ORGANIZATION_MUTATION,
            variables: {
                data: {
                    ...this.dvSenderFields,
                    country: this.organizationInfo.country,
                    name: this.organizationInfo.name,
                    meta: this.organizationInfo.meta,
                },
            },
        })
        this._organization = data.obj
        await updateItem({ listKey: 'Organization', item: {
            id: this._organization.id,
            data: {
                ...importInfo,
            },
        }, returnFields: 'id', ...this.context })
        return data.obj
    }
}




module.exports = {
    SbbolOrganization,
}
