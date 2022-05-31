const isObsConfigured = require('@condo/domains/common/utils/testSchema/isObsConfigured')
const { makeLoggedInAdminClient, setFakeClientMode, prepareKeystoneExpressApp } = require('@core/keystone/test.utils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket, createTestTicketComment } = require('@condo/domains/ticket/utils/testSchema')
const { exportTickets } = require('./exportTicketsTask')
const { createTestExportTicketTask, ExportTicketTask } = require('../utils/testSchema')
const { PROCESSING, EXCEL } = require('@condo/domains/common/constants/export')

let keystone

describe('exportTicketsTask', () => {
    describe('exportTickets', () => {
        setFakeClientMode(require('../../../index'))

        beforeAll(async () => {
            console.log('> beforeAll')
            const result = await prepareKeystoneExpressApp(require('../../../index'))
            keystone = result.keystone
        })

        it('exports tickets selected by filters specified in provided id of ExportTicketsTask record', async () => {
            console.log('> start')
            if (isObsConfigured()) {
                const adminClient = await makeLoggedInAdminClient()
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                const [organization] = await createTestOrganization(adminClient)
                const [property] = await createTestProperty(adminClient, organization)
                const [role] = await createTestOrganizationEmployeeRole(adminClient, organization, {
                    canManageTickets: true,
                    canManageTicketComments: true,
                })
                await createTestOrganizationEmployee(adminClient, organization, userClient.user, role)

                const [ticket] = await createTestTicket(userClient, organization, property)
                // Generated file should contain created comments, examine it manually
                for (let i = 0; i < 10; i++) {
                    await createTestTicketComment(userClient, ticket, userClient.user)
                }

                const task = await createTestExportTicketTask(userClient, {
                    format: EXCEL,
                    where: {
                        organization: { id: organization.id },
                    },
                    sortBy: 'createdAt_ASC',
                    locale: 'ru',
                    timeZone: 'Europe/Moscow',
                    status: PROCESSING,
                })

                await exportTickets(task.id)
                const updatedTask = await ExportTicketTask.getOne(userClient, task.id)
                expect(updatedTask.file).toBeDefined()
                expect(updatedTask.exportedRecordsCount).toEqual(1)
                // TODO(antonal): automatically examine created export file
            }
        })
    })
})