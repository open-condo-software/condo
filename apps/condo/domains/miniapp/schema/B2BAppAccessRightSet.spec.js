const index = require('@app/condo/index')
const { getItems } = require('@open-keystone/server-side-graphql-client')

const { setFakeClientMode, catchErrorFrom } = require('@open-condo/keystone/test.utils')

const {
    createTestB2BApp,
    createTestB2BAppContext,
    createTestB2BAppAccessRight,
    updateTestB2BAppAccessRight,
    createTestB2BAppAccessRightSet,
} = require('@condo/domains/miniapp/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const {
    createTestTicket,
    createTestTicketComment,
    createTestTicketCommentFile,
} = require('@condo/domains/ticket/utils/testSchema')
const {
    makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithSupportUser,
    registerNewServiceUserByTestClient,
    makeLoggedInClient,
} = require('@condo/domains/user/utils/testSchema')

const { keystone } = index

describe('B2BAppAccessRightSet check access through file middleware', () => {

    setFakeClientMode(index)

    let support
    let integratedServiceUser
    let user
    let notIntegratedServiceUser

    beforeAll(async () => {
        support = await makeClientWithSupportUser()
        const [newServiceUser] = await registerNewServiceUserByTestClient(support)
        integratedServiceUser = await makeLoggedInClient({
            email: newServiceUser.email,
            password: newServiceUser.password,
            type: 'service',
        })
        const [anotherServiceUser] = await registerNewServiceUserByTestClient(support)
        notIntegratedServiceUser = await makeLoggedInClient({
            email: anotherServiceUser.email,
            password: anotherServiceUser.password,
            type: 'service',
        })
        user = await makeClientWithNewRegisteredAndLoggedInUser()
    })

    test('Has access to file through meta check', async () => {
        const [organization] = await registerNewOrganization(user)
        const [app] = await createTestB2BApp(support)
        const [property] = await createTestProperty(user, organization)
        await createTestB2BAppContext(support, app, organization, { status: 'Finished' })
        const [right] = await createTestB2BAppAccessRight(support, integratedServiceUser.user, app)
        const [accessRightSet] = await createTestB2BAppAccessRightSet(support, app, {
            canReadTickets: true,
            canReadTicketComments: true,
            canReadTicketCommentFiles: true,
            canManageTicketCommentFiles: true,
        })
        await updateTestB2BAppAccessRight(support, right.id, { accessRightSet: { connect: { id: accessRightSet.id } } })
        const [ticket] = await createTestTicket(user, organization, property)
        const [ticketComment] = await createTestTicketComment(user, ticket, user.user)
        const [ticketCommentFile] = await createTestTicketCommentFile(user, ticket, ticketComment)
        const context = await keystone.createContext({ authentication: { item: integratedServiceUser.user, listKey: 'User' } })
        const items = await getItems({
            keystone,
            listKey: 'TicketCommentFile',
            context,
            where: { id: ticketCommentFile.id, deletedAt: null },
        })
        expect(items.find(({ id }) => id === ticketCommentFile.id)).not.toBeNull()
        const notIntegratedContext = await keystone.createContext({ authentication: { item: notIntegratedServiceUser.user, listKey: 'User' } })
        await catchErrorFrom(async () => {
            await getItems({
                keystone,
                listKey: 'TicketCommentFile',
                context: notIntegratedContext,
                where: { id: ticketCommentFile.id, deletedAt: null },
            })
        }, (error) => {
            expect(error.message).toEqual('You do not have access to this resource')
        })
    })
})