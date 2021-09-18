const faker = require('faker')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries.js')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/sbbol/common')
const { MULTIPLE_ACCOUNTS_MATCHES } = require('@condo/domains/user/constants/errors')
const { getItems, createItem, updateItem } = require('@keystonejs/server-side-graphql-client')
const { TokenSet: TokenSetAPI } = require('@condo/domains/organization/utils/serverSchema')
const { createConfirmedEmployee, createOrganization, createDefaultRoles } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { uniqBy, get } = require('lodash')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 // its real TTL is 180 days bit we need to update it earlier

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
                this.organization = { id: existingOrganization.id }
                return
            }
            this.organization = await this.createOrganization()
        } else  {
            this.organization = organization
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

    async updateTokens (info) {
        const { access_token, expires_at, refresh_token } = info
        const owner = {
            organization: {
                id: get(this.organization, 'id'),
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

    async createOrganization () {
        const organization = await createOrganization(this.adminContext, this.organizationInfo)
        const defaultRoles = await createDefaultRoles(this.adminContext, organization, this.dvSenderFields)
        await createConfirmedEmployee(this.adminContext, organization, {
            ...this.userInfo,
            id: this.user.id,
        }, defaultRoles.Administrator, this.dvSenderFields)
        return organization
    }

}




module.exports = {
    SbbolOrganization,
}
