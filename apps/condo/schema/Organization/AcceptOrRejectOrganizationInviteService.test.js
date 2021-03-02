/**
 * @jest-environment node
 */

const {
    acceptOrRejectOrganizationInviteById,
    inviteNewOrganizationEmployee,
    makeClientWithRegisteredOrganization,
} = require('../../utils/testSchema/Organization')
const { setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('../User.test')

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../../index'))

// TODO(pahaz): check antonymous ACCEPT_OR_REJECT_BY_ID_MUTATION
describe('AcceptOrRejectOrganizationInviteService', () => {
    test('user: accept/reject', async () => {
        const client1 = await makeClientWithRegisteredOrganization()
        const client2 = await makeClientWithNewRegisteredAndLoggedInUser()

        const [invite] = await inviteNewOrganizationEmployee(client1, client1.organization, client2.user)
        const [accepted] = await acceptOrRejectOrganizationInviteById(client2, invite)

        expect(accepted).toEqual(expect.objectContaining({
            isAccepted: true,
            isRejected: false,
        }))

        const [rejected] = await acceptOrRejectOrganizationInviteById(client2, invite, { isRejected: true })

        expect(rejected).toEqual(expect.objectContaining({
            isRejected: true,
        }))
    })
})
