/**
 * @jest-environment node
 */
const { makeLoggedInAdminClient, setFakeClientMode } = require('@core/keystone/test.utils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { exportTickets } = require('./exportTicketsTask')
const { createTestTicketExportTask, TicketExportTask } = require('../utils/testSchema')
const { PROCESSING, EXCEL } = require('@condo/domains/common/constants/export')

const index = require('../../../index')
const { COMPLETED } = require('@condo/domains/common/constants/export')
const { catchErrorFrom } = require('@condo/domains/common/utils/testSchema')

describe('exportTicketsTask', () => {
    describe('exportTickets', () => {
        setFakeClientMode(index)

        it('exports tickets selected by filters specified in provided id of ExportTicketsTask record', async () => {
            const adminClient = await makeLoggedInAdminClient()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await createTestOrganization(adminClient)
            const [property] = await createTestProperty(adminClient, organization)
            const [role] = await createTestOrganizationEmployeeRole(adminClient, organization, {
                canManageTickets: true,
                canManageTicketComments: true,
            })
            await createTestOrganizationEmployee(adminClient, organization, userClient.user, role)

            await createTestTicket(userClient, organization, property)
            const [task] = await createTestTicketExportTask(adminClient, userClient.user, {
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

            const updatedTask = await TicketExportTask.getOne(userClient, { id: task.id })
            expect(updatedTask.file).toBeDefined()
            expect(updatedTask.file).not.toBeNull()
            expect(updatedTask.exportedRecordsCount).toEqual(1)
            // TODO(antonal): automatically examine created export file
        })

        it('throws error if nothing to export and changes task state to "completed" value', async () => {
            const adminClient = await makeLoggedInAdminClient()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await createTestOrganization(adminClient)
            const [role] = await createTestOrganizationEmployeeRole(adminClient, organization, {
                canManageTickets: true,
                canManageTicketComments: true,
            })
            await createTestOrganizationEmployee(adminClient, organization, userClient.user, role)

            const [task] = await createTestTicketExportTask(adminClient, userClient.user, {
                format: EXCEL,
                where: {
                    organization: { id: organization.id },
                },
                sortBy: 'createdAt_ASC',
                locale: 'ru',
                timeZone: 'Europe/Moscow',
                status: PROCESSING,
            })

            await catchErrorFrom(async () => {
                await exportTickets(task.id)
            }, async ( e) => {
                expect(e).toMatchObject({
                    message: `No records to export for TicketExportTask with id "${task.id}"`,
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        type: 'NOTHING_TO_EXPORT',
                        messageForUser: 'tasks.export.error.NOTHING_TO_EXPORT',
                    },
                })
                const updatedTask = await TicketExportTask.getOne(userClient, { id: task.id })
                expect(updatedTask.status).toEqual(COMPLETED)
                expect(updatedTask.file).toBeNull()
                expect(updatedTask.exportedRecordsCount).toEqual(0)
            })
        })
    })
})