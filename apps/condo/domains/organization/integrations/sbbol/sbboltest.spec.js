const { syncOrganization } = require('@condo/domains/organization/integrations/sbbol/sync/syncOrganization')
const { syncUser } = require('@condo/domains/organization/integrations/sbbol/sync/syncUser')
const { MockSbbolServer } = require('@condo/domains/organization/integrations/sbbol/sync/mockSbbolServer')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries.js')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/common')
const { getSchemaCtx } = require('@core/keystone/schema')
const { updateTestUser, User: UserAPI } = require('@condo/domains/user/utils/testSchema')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { updateTestOrganization, Organization: OrganizationAPI, OrganizationEmployee: OrganizationEmployeeAPI  } = require('@condo/domains/organization/utils/testSchema')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const path = require('path')
const faker = require('faker')

let _keystone = null

async function getKeystone () {
    if (_keystone) {
        return _keystone
    }
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()
    _keystone = keystone
    return _keystone
}

// no subscriptions or tokens sync
const testSync = async (userInfo) => {
    const keystone = await getKeystone()
    const adminContext = await keystone.createContext({ skipAccessControl: true })
    const context = {
        keystone,
        context: adminContext,
    }
    const dvSenderFields = {
        dv: 1,
        sender: { dv: 1, fingerprint: `test-${SBBOL_IMPORT_NAME}` },
    }
    const organizationInfo = {
        ...dvSenderFields,
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
        importId: userInfo.HashOrgId,
    }
    if (!userInfo.phone_number.startsWith('+')) {
        userInfo.phone_number = `+${userInfo.phone_number}`
    }
    const userData = {
        ...dvSenderFields,
        name: userInfo.OrgName,
        importId: userInfo.userGuid,
        importRemoteSystem: SBBOL_IMPORT_NAME,
        email: userInfo.email,
        phone: userInfo.phone_number,
        isPhoneVerified: true,
        isEmailVerified: true,
        password: faker.internet.password(),
    }
    const user = await syncUser({ context, userInfo: userData, dvSenderFields })
    const organization = await syncOrganization({ context, user, userInfo, organizationInfo, dvSenderFields })
    return { user, organization }
}

describe('Sbbol sync scenarios', () => {
    describe('User not exists, Organization not exists', () => {
        it('should create User, Organization, Employee with role', async () => {
            const admin = await makeLoggedInAdminClient()
            const api = new MockSbbolServer()
            const userInfo = await api.get('/v1/oauth/user-info')
            const { user, organization } = await testSync(userInfo)
            const [userFromDb] = await UserAPI.getAll(admin, { phone: userInfo.phone_number })
            expect(userFromDb.id).toEqual(user.id)
            expect(userFromDb.importId).toEqual(userInfo.userGuid)
            expect(userFromDb.importRemoteSystem).toEqual(SBBOL_IMPORT_NAME)
            const [organizationFromDb] = await OrganizationAPI.getAll(admin, { id: organization.id })
            expect(organizationFromDb.meta.inn).toEqual(userInfo.inn)
            expect(organizationFromDb.name).toEqual(userInfo.OrgName)
            expect(organizationFromDb.importRemoteSystem).toEqual(SBBOL_IMPORT_NAME)
            expect(organizationFromDb.importId).toEqual(userInfo.HashOrgId)
            const [employee] = await OrganizationEmployeeAPI.getAll(admin, {
                organization: { id: organization.id },
                user: { id: user.id },
            })
            expect(employee.role.name).toEqual('Administrator')
        }, 20000)
    })
    describe('User exists Organization not exists', () => {
        it('should update Organization importId if User has Organization with a same tin', async () => {
            const api = new MockSbbolServer()
            const info = await api.get('/v1/oauth/user-info')
            const client = await makeClientWithRegisteredOrganization()
            const admin = await makeLoggedInAdminClient()
            await updateTestUser(admin, client.user.id, {
                phone: info.phone_number,
                importId: info.userGuid,
                importRemoteSystem: SBBOL_IMPORT_NAME,
            })
            await updateTestOrganization(admin, client.organization.id, {
                meta: { ...client.organization.meta, inn: info.inn },
            })
            await testSync(info)
            const [organization] = await OrganizationAPI.getAll(client, { id: client.organization.id })
            expect(organization.importRemoteSystem).toEqual(SBBOL_IMPORT_NAME)
            expect(organization.importId).toEqual(info.HashOrgId)
            const [user] = await UserAPI.getAll(client, { id: client.user.id })
            expect(user.importId).toEqual(info.userGuid)
            expect(user.importRemoteSystem).toEqual(SBBOL_IMPORT_NAME)
        }, 20000)
        it('should create Organization and make user its employee', async () => {
            const api = new MockSbbolServer()
            const info = await api.get('/v1/oauth/user-info')
            const client = await makeClientWithRegisteredOrganization()
            const admin = await makeLoggedInAdminClient()
            await updateTestUser(admin, client.user.id, {
                phone: info.phone_number,
                importId: info.userGuid,
                importRemoteSystem: SBBOL_IMPORT_NAME,
            })
            const Sync = await testSync(info)
            const [organization] = await OrganizationAPI.getAll(admin, {
                importId: info.HashOrgId,
                importRemoteSystem: SBBOL_IMPORT_NAME,
            })
            expect(organization.id).not.toEqual(client.organization.id)
            expect(organization.meta.inn).toEqual(info.inn)
            const [employee] = await OrganizationEmployeeAPI.getAll(admin, {
                organization: { id: Sync.organization.id },
                user: { id: Sync.user.id },
            })
            expect(employee.role.name).toEqual('Administrator')
        }, 20000)
    })
    describe('User not exists Organization exists', () => {
        it('should create User and make him employee for the Organization', async () => {
            const api = new MockSbbolServer()
            const info = await api.get('/v1/oauth/user-info')
            const client = await makeClientWithRegisteredOrganization()
            const admin = await makeLoggedInAdminClient()
            await updateTestOrganization(admin, client.organization.id, {
                meta: { ...client.organization.meta, inn: info.inn },
                importId: info.HashOrgId,
                importRemoteSystem: SBBOL_IMPORT_NAME,
            })
            await testSync(info)
            const [employee] = await OrganizationEmployeeAPI.getAll(admin, {
                organization: { id: client.organization.id },
                user: { id_not: client.user.id },
            })
            expect(employee).toBeDefined()
            expect(employee.role.name).toEqual('Administrator')
        }, 20000)
    })
})
