/**
 * @jest-environment node
 */

const mockPushOrganizationToSalesCRM = jest.fn()

const index = require('@app/condo/index')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { SBBOL_FINGERPRINT_NAME } = require('./sbbol/constants')
const { MockSbbolResponses } = require('./sbbol/sync/MockSbbolResponses')
const { syncOrganization } = require('./sbbol/sync/syncOrganization')

const { makeClientWithRegisteredOrganization } = require('../utils/testSchema/Organization')

const { keystone } = index

jest.mock('../utils/serverSchema/Organization')
jest.mock('../utils/serverSchema/Organization', () => {
    const originalOrg = jest.requireActual('../utils/serverSchema/Organization')
    return {
        ...originalOrg,
        pushOrganizationToSalesCRM: mockPushOrganizationToSalesCRM,
    }
})

describe('Interaction with sales CRM', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    setFakeClientMode(index)

    it('should send to sales crm new organization', async () => {
        const client = await makeClientWithRegisteredOrganization()
        expect(mockPushOrganizationToSalesCRM).toBeCalled()
        expect(mockPushOrganizationToSalesCRM).lastCalledWith(
            expect.objectContaining({ 
                id: client.organization.id, 
                sender: expect.not.objectContaining({
                    fingerprint: SBBOL_FINGERPRINT_NAME,
                }),
            }))
    })
    it('should send to sales crm imported from sbbol organization', async () => {
        const { userData, organizationData, dvSenderFields } = MockSbbolResponses.getUserAndOrganizationInfo()
        const adminContext = await keystone.createContext({ skipAccessControl: true })
        const context = {
            keystone,
            context: adminContext,
        }
        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        const user = client.user
        userData.phone = user.phone
        const { organization: org } = await syncOrganization({
            context,
            user: user,
            userInfo: userData,
            dvSenderFields,
            organizationInfo: organizationData,
        })
        expect(mockPushOrganizationToSalesCRM).toBeCalled()
        expect(mockPushOrganizationToSalesCRM).lastCalledWith(
            expect.objectContaining({ 
                id: org.id, 
                sender: expect.objectContaining({
                    fingerprint: SBBOL_FINGERPRINT_NAME,
                }),
            }))
    })
})