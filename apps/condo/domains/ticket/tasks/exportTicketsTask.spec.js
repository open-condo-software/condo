/**
 * @jest-environment node
 */
const { makeLoggedInAdminClient, setFakeClientMode, waitFor } = require('@condo/keystone/test.utils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { createTestTicketExportTask, TicketExportTask } = require('../utils/testSchema')
const { PROCESSING, EXCEL, EXPORT_PROCESSING_BATCH_SIZE } = require('@condo/domains/common/constants/export')

const index = require('@app/condo/index')

describe('exportTicketsTask', () => {
    describe('exportTickets', () => {
        setFakeClientMode(index)
        // We need more time to generate tickets to process them chunk-by-chunk
        jest.setTimeout(60000)

        it('launches in `TicketExportTask.afterChange` hook on "create" operation and processes tickets selected by filters specified in provided id of TicketExportTask record chunk-by-chunk', async () => {
            const adminClient = await makeLoggedInAdminClient()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await createTestOrganization(adminClient)
            const [property] = await createTestProperty(adminClient, organization)
            const [role] = await createTestOrganizationEmployeeRole(adminClient, organization, {
                canManageTickets: true,
                canManageTicketComments: true,
            })
            await createTestOrganizationEmployee(adminClient, organization, userClient.user, role)

            const ticketsCountFor2Chunks = Math.floor(EXPORT_PROCESSING_BATCH_SIZE * 1.5)
            for (let i = ticketsCountFor2Chunks; i > 0; i--) {
                await createTestTicket(userClient, organization, property)
            }

            const [task] = await createTestTicketExportTask(userClient, userClient.user, {
                format: EXCEL,
                where: {
                    organization: { id: organization.id },
                },
                sortBy: 'createdAt_ASC',
                locale: 'ru',
                timeZone: 'Europe/Moscow',
                status: PROCESSING,
            })

            // NOTE: This function is launched in `TicketExportTask.afterChange` hook on "create" operation
            // Don't need to call it explicitly
            // await exportTicketsWorker.apply(jobMock, [task.id])

            await waitFor(async () => {
                const updatedTask = await TicketExportTask.getOne(userClient, { id: task.id })
                expect(updatedTask.file).toBeDefined()
                expect(updatedTask.file).not.toBeNull()
                expect(updatedTask.exportedRecordsCount).toEqual(ticketsCountFor2Chunks)
                expect(updatedTask.totalRecordsCount).toEqual(ticketsCountFor2Chunks)
                expect(updatedTask.status).toEqual('completed')
            })
        })
    })
})