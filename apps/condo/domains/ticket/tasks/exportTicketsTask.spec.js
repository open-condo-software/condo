/**
 * @jest-environment node
 */
const { makeLoggedInAdminClient, setFakeClientMode } = require('@condo/keystone/test.utils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { exportTicketsWorker } = require('./exportTicketsTask')
const { createTestTicketExportTask, TicketExportTask } = require('../utils/testSchema')
const { PROCESSING, EXCEL } = require('@condo/domains/common/constants/export')

const index = require('../../../index')
const { COMPLETED } = require('@condo/domains/common/constants/export')
const { catchErrorFrom } = require('@condo/domains/common/utils/testSchema')
const { EXPORT_PROCESSING_BATCH_SIZE } = require('../../common/constants/export')

const jobMock = {
    progress: jest.fn().mockImplementation(),
}

describe('exportTicketsTask', () => {
    describe('exportTickets', () => {
        setFakeClientMode(index)
        // We need more time to generate tickets to process them chunk-by-chunk
        jest.setTimeout(60000)

        it('processes tickets selected by filters specified in provided id of TicketExportTask record chunk-by-chunk', async () => {
            const adminClient = await makeLoggedInAdminClient()
            const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await createTestOrganization(adminClient)
            const [property] = await createTestProperty(adminClient, organization)
            const [role] = await createTestOrganizationEmployeeRole(adminClient, organization, {
                canManageTickets: true,
                canManageTicketComments: true,
            })
            await createTestOrganizationEmployee(adminClient, organization, userClient.user, role)

            let ticketsCountFor2Chunks = Math.floor(EXPORT_PROCESSING_BATCH_SIZE * 1.5)
            let i = ticketsCountFor2Chunks
            do {
                await createTestTicket(userClient, organization, property)
            } while (--i > 0)

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

            // NOTE: when using `apply` we need to send params as an array to avoid an error "TypeError: CreateListFromArrayLike called on non-object"
            await exportTicketsWorker.apply(jobMock, [task.id])

            const updatedTask = await TicketExportTask.getOne(userClient, { id: task.id })
            expect(updatedTask.file).toBeDefined()
            expect(updatedTask.file).not.toBeNull()
            expect(updatedTask.exportedRecordsCount).toEqual(ticketsCountFor2Chunks)
            expect(updatedTask.totalRecordsCount).toEqual(ticketsCountFor2Chunks)
            expect(jobMock.progress.mock.calls.length).toEqual(2)
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
                // NOTE: when using `apply` we need to send params as an array to avoid an error "TypeError: CreateListFromArrayLike called on non-object"
                await exportTicketsWorker.apply(jobMock, [task.id])
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
                expect(updatedTask.totalRecordsCount).toEqual(0)
            })
        })
    })
})