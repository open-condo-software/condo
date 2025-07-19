/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { setFakeClientMode, setFeatureFlag, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')
const { i18n } = require('@open-condo/locales/loader')

const { RETENTION_LOOPS_ENABLED, SEND_DAILY_STATISTICS_TASK } = require('@condo/domains/common/constants/featureflags')
const { SEND_DAILY_STATISTICS_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { makeEmployeeUserClientWithAbilities, createTestOrganizationEmployee, createTestOrganizationEmployeeRole } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { INCIDENT_STATUS_NOT_ACTUAL, INCIDENT_CATEGORY_IDS, INCIDENT_PROBLEM_IDS } = require('@condo/domains/ticket/constants/incident')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { updateTestTicket, createTestIncidentProperty } = require('@condo/domains/ticket/utils/testSchema')
const {
    createTestTicket, TicketStatus, createTestIncident, createTestIncidentClassifierIncident, IncidentClassifier,
} = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { UserDailyStatistics, sendDailyMessageToUserSafely } = require('./sendDailyStatistics')


describe('sendDailyStatistics helpers', () => {
    let admin, allowedIncidentClassifiers, notAllowedIncidentClassifiers
    setFakeClientMode(index)

    beforeAll(async () => {
        setFeatureFlag(RETENTION_LOOPS_ENABLED, true)
        admin = await makeLoggedInAdminClient()

        allowedIncidentClassifiers = await IncidentClassifier.getAll(admin, {
            category: {
                id: INCIDENT_CATEGORY_IDS.WATER,
            },
            problem: {
                id_in: [
                    INCIDENT_PROBLEM_IDS.NO_HOT_AND_COLD_WATER,
                    INCIDENT_PROBLEM_IDS.NOT_HOT_WATER,
                    INCIDENT_PROBLEM_IDS.NO_COLD_WATER,
                ],
            },
        })
        notAllowedIncidentClassifiers = await IncidentClassifier.getAll(admin, {
            id_not_in: allowedIncidentClassifiers.map(item => item.id),
        })
    })

    describe('class UserDailyStatistics', () => {
        describe('should return correct statistic data for user', () => {
            let userData = {
                client: null,
                organizationWithAccess1: {
                    data: null,
                    property: null,
                },
                organizationWithAccess2: {
                    data: null,
                    property: null,
                },
                organizationWithoutAccess: {
                    data: null,
                    property: null,
                },
            }
            let justEmployeeClient

            beforeEach(async () => {
                setFeatureFlag(SEND_DAILY_STATISTICS_TASK, false)

                const administratorClient = await makeEmployeeUserClientWithAbilities({
                    canManageOrganization: true,
                    canManageTickets: true,
                    canReadTickets: true,
                    canManageIncidents: true,
                    canReadIncidents: true,
                })
                userData.client = administratorClient
                userData.organizationWithAccess1.data = administratorClient.organization
                userData.organizationWithAccess1.property = administratorClient.property

                const client2 = await makeEmployeeUserClientWithAbilities({
                    canManageOrganization: true,
                    canManageTickets: true,
                    canReadTickets: true,
                    canManageIncidents: true,
                    canReadIncidents: true,
                })
                await createTestOrganizationEmployee(admin, client2.organization, administratorClient.user, client2.role)
                userData.organizationWithAccess2.data = client2.organization
                userData.organizationWithAccess2.property = client2.property

                const client3 = await makeEmployeeUserClientWithAbilities({
                    canManageOrganization: false,
                    canManageTickets: true,
                    canReadTickets: true,
                    canManageIncidents: true,
                    canReadIncidents: true,
                })
                await createTestOrganizationEmployee(admin, client3.organization, administratorClient.user, client3.role)
                userData.organizationWithoutAccess.data = client3.organization
                userData.organizationWithoutAccess.property = client3.property

                justEmployeeClient = await makeClientWithNewRegisteredAndLoggedInUser()
                const [role] = await createTestOrganizationEmployeeRole(admin, administratorClient.organization, { canManageOrganization: false })
                await createTestOrganizationEmployee(admin, administratorClient.organization, justEmployeeClient.user, role)
            })

            describe('Tickets', () => {
                describe('must correctly calculate the number of tickets for each organization in which the user is a member and has the "canManageOrganization" right, and their total count', () => {
                    test('must count the number of tickets in the status "in process"', async () => {
                        const generateTicketsForEveryStatus = async (organization, property) => {
                            for (const status of Object.values(STATUS_IDS)) {
                                await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: status } },
                                    ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                })
                            }
                        }

                        await generateTicketsForEveryStatus(userData.organizationWithAccess1.data, userData.organizationWithAccess1.property)
                        await generateTicketsForEveryStatus(userData.organizationWithAccess2.data, userData.organizationWithAccess2.property)
                        await generateTicketsForEveryStatus(userData.organizationWithoutAccess.data, userData.organizationWithoutAccess.property)

                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, true)
                        // user can get stats only for organizations which have canManageOrganization
                        const administratorStatistics = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics.loadStatistics()
                        const administratorResult =  await administratorStatistics.loadStatistics()

                        expect(administratorResult.tickets.inProgress.total).toBe(2)
                        expect(administratorResult.tickets.inProgress.byOrganizations).toHaveLength(2)
                        expect(administratorResult.tickets.inProgress.byOrganizations).toEqual(expect.arrayContaining([
                            expect.objectContaining({
                                name: userData.organizationWithAccess1.data.name,
                                count: 1,
                            }),
                            expect.objectContaining({
                                name: userData.organizationWithAccess2.data.name,
                                count: 1,
                            }),
                        ]))

                        // just employee can not get stats
                        const justEmployeeStatistics = new UserDailyStatistics(justEmployeeClient.user.id)
                        await justEmployeeStatistics.loadStatistics()
                        const justEmployeeResult =  await justEmployeeStatistics.loadStatistics()

                        expect(justEmployeeResult.tickets.inProgress.total).toBe(0)
                        expect(justEmployeeResult.tickets.inProgress.byOrganizations).toHaveLength(0)


                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, false)
                        // user can not get stats if feature flag enabled
                        const administratorStatistics2 = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics2.loadStatistics()
                        const administratorResult2 =  await administratorStatistics2.loadStatistics()

                        expect(administratorResult2.tickets.inProgress.total).toBe(0)
                        expect(administratorResult2.tickets.inProgress.byOrganizations).toHaveLength(0)
                    })

                    test('must count the number of emergency tickets in the status "open"', async () => {
                        const generateTicketsForEveryStatus = async (organization, property) => {
                            for (const status of Object.values(STATUS_IDS)) {
                                await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: status } },
                                    ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                    isEmergency: true,
                                })
                                await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: status } },
                                    ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                    isEmergency: false,
                                })
                            }
                        }

                        await generateTicketsForEveryStatus(userData.organizationWithAccess1.data, userData.organizationWithAccess1.property)
                        await generateTicketsForEveryStatus(userData.organizationWithAccess2.data, userData.organizationWithAccess2.property)
                        await generateTicketsForEveryStatus(userData.organizationWithoutAccess.data, userData.organizationWithoutAccess.property)


                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, true)
                        // user can get stats only for organizations which have canManageOrganization
                        const administratorStatistics = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics.loadStatistics()
                        const administratorResult =  await administratorStatistics.loadStatistics()

                        expect(administratorResult.tickets.isEmergency.total).toBe(2)
                        expect(administratorResult.tickets.isEmergency.byOrganizations).toHaveLength(2)
                        expect(administratorResult.tickets.isEmergency.byOrganizations).toEqual(expect.arrayContaining([
                            expect.objectContaining({
                                name: userData.organizationWithAccess1.data.name,
                                count: 1,
                            }),
                            expect.objectContaining({
                                name: userData.organizationWithAccess2.data.name,
                                count: 1,
                            }),
                        ]))

                        // just employee can not get stats
                        const justEmployeeStatistics = new UserDailyStatistics(justEmployeeClient.user.id)
                        await justEmployeeStatistics.loadStatistics()
                        const justEmployeeResult =  await justEmployeeStatistics.loadStatistics()

                        expect(justEmployeeResult.tickets.isEmergency.total).toBe(0)
                        expect(justEmployeeResult.tickets.isEmergency.byOrganizations).toHaveLength(0)


                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, false)
                        // user can not get stats if feature flag enabled
                        const administratorStatistics2 = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics2.loadStatistics()
                        const administratorResult2 =  await administratorStatistics2.loadStatistics()

                        expect(administratorResult2.tickets.isEmergency.total).toBe(0)
                        expect(administratorResult2.tickets.isEmergency.byOrganizations).toHaveLength(0)
                    })

                    test('must count the number of returned tickets in the status "open"', async () => {
                        const generateTicketsForEveryStatus = async (organization, property) => {
                            for (const status of Object.values(STATUS_IDS)) {
                                const [ticket] = await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: STATUS_IDS.COMPLETED } },
                                })
                                await updateTestTicket(userData.client, ticket.id, {
                                    status: { connect: { id: STATUS_IDS.OPEN } },
                                })

                                if (status !== STATUS_IDS.OPEN) {
                                    await updateTestTicket(userData.client, ticket.id, {
                                        status: { connect: { id: status } },
                                        ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                    })
                                }
                            }
                        }

                        await generateTicketsForEveryStatus(userData.organizationWithAccess1.data, userData.organizationWithAccess1.property)
                        await generateTicketsForEveryStatus(userData.organizationWithAccess2.data, userData.organizationWithAccess2.property)
                        await generateTicketsForEveryStatus(userData.organizationWithoutAccess.data, userData.organizationWithoutAccess.property)


                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, true)
                        // user can get stats only for organizations which have canManageOrganization
                        const administratorStatistics = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics.loadStatistics()
                        const administratorResult =  await administratorStatistics.loadStatistics()

                        expect(administratorResult.tickets.isReturned.total).toBe(2)
                        expect(administratorResult.tickets.isReturned.byOrganizations).toHaveLength(2)
                        expect(administratorResult.tickets.isReturned.byOrganizations).toEqual(expect.arrayContaining([
                            expect.objectContaining({
                                name: userData.organizationWithAccess1.data.name,
                                count: 1,
                            }),
                            expect.objectContaining({
                                name: userData.organizationWithAccess2.data.name,
                                count: 1,
                            }),
                        ]))

                        // just employee can not get stats
                        const justEmployeeStatistics = new UserDailyStatistics(justEmployeeClient.user.id)
                        await justEmployeeStatistics.loadStatistics()
                        const justEmployeeResult =  await justEmployeeStatistics.loadStatistics()

                        expect(justEmployeeResult.tickets.isReturned.total).toBe(0)
                        expect(justEmployeeResult.tickets.isReturned.byOrganizations).toHaveLength(0)


                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, false)
                        // user can not get stats if feature flag enabled
                        const administratorStatistics2 = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics2.loadStatistics()
                        const administratorResult2 =  await administratorStatistics2.loadStatistics()

                        expect(administratorResult2.tickets.isReturned.total).toBe(0)
                        expect(administratorResult2.tickets.isReturned.byOrganizations).toHaveLength(0)
                    })

                    test('must count the number of expired tickets in the status "open", "in process" and "postponed"', async () => {
                        const generateTicketsForEveryStatus = async (organization, property) => {
                            for (const status of Object.values(STATUS_IDS)) {
                                await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: status } },
                                    ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                    deadline: dayjs().subtract(1, 'day'),
                                })
                                await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: status } },
                                    ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                    deadline: dayjs().add(1, 'day'),
                                })
                            }
                        }

                        await generateTicketsForEveryStatus(userData.organizationWithAccess1.data, userData.organizationWithAccess1.property)
                        await generateTicketsForEveryStatus(userData.organizationWithAccess2.data, userData.organizationWithAccess2.property)
                        await generateTicketsForEveryStatus(userData.organizationWithoutAccess.data, userData.organizationWithoutAccess.property)


                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, true)
                        // user can get stats only for organizations which have canManageOrganization
                        const administratorStatistics = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics.loadStatistics()
                        const administratorResult =  await administratorStatistics.loadStatistics()

                        expect(administratorResult.tickets.isExpired.total).toBe(6)
                        expect(administratorResult.tickets.isExpired.byOrganizations).toHaveLength(2)
                        expect(administratorResult.tickets.isExpired.byOrganizations).toEqual(expect.arrayContaining([
                            expect.objectContaining({
                                name: userData.organizationWithAccess1.data.name,
                                count: 3,
                            }),
                            expect.objectContaining({
                                name: userData.organizationWithAccess2.data.name,
                                count: 3,
                            }),
                        ]))

                        // just employee can not get stats
                        const justEmployeeStatistics = new UserDailyStatistics(justEmployeeClient.user.id)
                        await justEmployeeStatistics.loadStatistics()
                        const justEmployeeResult =  await justEmployeeStatistics.loadStatistics()

                        expect(justEmployeeResult.tickets.isExpired.total).toBe(0)
                        expect(justEmployeeResult.tickets.isExpired.byOrganizations).toHaveLength(0)


                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, false)
                        // user can not get stats if feature flag enabled
                        const administratorStatistics2 = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics2.loadStatistics()
                        const administratorResult2 =  await administratorStatistics2.loadStatistics()

                        expect(administratorResult2.tickets.isExpired.total).toBe(0)
                        expect(administratorResult2.tickets.isExpired.byOrganizations).toHaveLength(0)
                    })

                    test('must count the number of tickets without an executor or responsible person in the status "open"', async () => {
                        const generateTicketsForEveryStatus = async (organization, property) => {
                            for (const status of Object.values(STATUS_IDS)) {
                                await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: status } },
                                    ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                })
                                await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: status } },
                                    ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                    executor: { connect: { id: userData.client.user.id } },
                                })
                                await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: status } },
                                    ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                    assignee: { connect: { id: userData.client.user.id } },
                                })
                                await createTestTicket(userData.client, organization, property, {
                                    status: { connect: { id: status } },
                                    ...status === STATUS_IDS.DEFERRED ? { deferredUntil: dayjs().add(1, 'day') } : undefined,
                                    assignee: { connect: { id: userData.client.user.id } },
                                    executor: { connect: { id: userData.client.user.id } },
                                })
                            }
                        }

                        await generateTicketsForEveryStatus(userData.organizationWithAccess1.data, userData.organizationWithAccess1.property)
                        await generateTicketsForEveryStatus(userData.organizationWithAccess2.data, userData.organizationWithAccess2.property)
                        await generateTicketsForEveryStatus(userData.organizationWithoutAccess.data, userData.organizationWithoutAccess.property)


                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, true)
                        // user can get stats only for organizations which have canManageOrganization
                        const administratorStatistics = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics.loadStatistics()
                        const administratorResult =  await administratorStatistics.loadStatistics()

                        expect(administratorResult.tickets.withoutEmployee.total).toBe(6)
                        expect(administratorResult.tickets.withoutEmployee.byOrganizations).toHaveLength(2)
                        expect(administratorResult.tickets.withoutEmployee.byOrganizations).toEqual(expect.arrayContaining([
                            expect.objectContaining({
                                name: userData.organizationWithAccess1.data.name,
                                count: 3,
                            }),
                            expect.objectContaining({
                                name: userData.organizationWithAccess2.data.name,
                                count: 3,
                            }),
                        ]))

                        // just employee can not get stats
                        const justEmployeeStatistics = new UserDailyStatistics(justEmployeeClient.user.id)
                        await justEmployeeStatistics.loadStatistics()
                        const justEmployeeResult =  await justEmployeeStatistics.loadStatistics()

                        expect(justEmployeeResult.tickets.withoutEmployee.total).toBe(0)
                        expect(justEmployeeResult.tickets.withoutEmployee.byOrganizations).toHaveLength(0)


                        setFeatureFlag(SEND_DAILY_STATISTICS_TASK, false)
                        // user can not get stats if feature flag enabled
                        const administratorStatistics2 = new UserDailyStatistics(userData.client.user.id)
                        await administratorStatistics2.loadStatistics()
                        const administratorResult2 =  await administratorStatistics2.loadStatistics()

                        expect(administratorResult2.tickets.withoutEmployee.total).toBe(0)
                        expect(administratorResult2.tickets.withoutEmployee.byOrganizations).toHaveLength(0)
                    })
                })
            })

            describe('Incidents', () => {
                test('must collect correct data on actual incidents that will start within the next 24 hours only from organizations in which the user has "canManageOrganization" rights', async () => {
                    const incidentsForOnePropertyToTests = []
                    const incidentsForAllPropertyToTests = []

                    const generateTicketsForOrganization = async (organization, property) => {
                        const [actualWaterIncidentSoonForAllProperties] = await createTestIncident(userData.client, organization, {
                            details: 'actualWaterIncidentSoonForAllProperties',
                            workStart: dayjs().add(24, 'hours'),
                            hasAllProperties: true,
                        })
                        await createTestIncidentClassifierIncident(userData.client, actualWaterIncidentSoonForAllProperties, faker.helpers.arrayElement(allowedIncidentClassifiers))

                        const [actualWaterIncidentSoonForOneProperty] = await createTestIncident(userData.client, organization, {
                            details: 'actualWaterIncidentSoonForOneProperty',
                            workStart: dayjs().add(2, 'minute'),
                            workFinish: dayjs().add(2, 'days'),
                        })
                        await createTestIncidentClassifierIncident(userData.client, actualWaterIncidentSoonForOneProperty, faker.helpers.arrayElement(allowedIncidentClassifiers))
                        await createTestIncidentProperty(userData.client, actualWaterIncidentSoonForOneProperty, property)

                        const [actualNotWaterIncidentSoon] = await createTestIncident(userData.client, organization, {
                            details: 'actualNotWaterIncidentSoon',
                            workStart: dayjs().add(12, 'hours'),
                            workFinish: dayjs().add(2, 'days'),
                        })
                        await createTestIncidentClassifierIncident(userData.client, actualNotWaterIncidentSoon, faker.helpers.arrayElement(notAllowedIncidentClassifiers))

                        const [notActualWaterIncidentSoon] = await createTestIncident(userData.client, organization, {
                            details: 'notActualWaterIncidentSoon',
                            workStart: dayjs().add(12, 'hours'),
                            status: INCIDENT_STATUS_NOT_ACTUAL,
                            workFinish: dayjs().add(13, 'hours'),
                        })
                        await createTestIncidentClassifierIncident(userData.client, notActualWaterIncidentSoon, faker.helpers.arrayElement(notAllowedIncidentClassifiers))

                        const [actualWaterIncidentAlreadyStarted] = await createTestIncident(userData.client, organization, {
                            details: 'actualWaterIncidentAlreadyStarted',
                            workStart: dayjs().subtract(12, 'hours'),
                            workFinish: dayjs().add(2, 'days'),
                        })
                        await createTestIncidentClassifierIncident(userData.client, actualWaterIncidentAlreadyStarted, faker.helpers.arrayElement(notAllowedIncidentClassifiers))

                        const [actualWaterIncidentInFuture] = await createTestIncident(userData.client, organization, {
                            details: 'actualWaterIncidentInFuture',
                            workStart: dayjs().add(25, 'hours'),
                            workFinish: dayjs().add(2, 'days'),
                        })
                        await createTestIncidentClassifierIncident(userData.client, actualWaterIncidentInFuture, faker.helpers.arrayElement(notAllowedIncidentClassifiers))

                        const [actualWaterIncidentInPast] = await createTestIncident(userData.client, organization, {
                            details: 'actualWaterIncidentInPast',
                            workStart: dayjs().subtract(1, 'hours'),
                            workFinish: dayjs().add(2, 'days'),
                        })
                        await createTestIncidentClassifierIncident(userData.client, actualWaterIncidentInPast, faker.helpers.arrayElement(notAllowedIncidentClassifiers))

                        incidentsForOnePropertyToTests.push({ incident: actualWaterIncidentSoonForOneProperty, property })
                        incidentsForAllPropertyToTests.push({ incident: actualWaterIncidentSoonForAllProperties, property })
                    }

                    await generateTicketsForOrganization(userData.organizationWithAccess1.data, userData.organizationWithAccess1.property)
                    await generateTicketsForOrganization(userData.organizationWithAccess2.data, userData.organizationWithAccess2.property)
                    await generateTicketsForOrganization(userData.organizationWithoutAccess.data, userData.organizationWithoutAccess.property)

                    setFeatureFlag(SEND_DAILY_STATISTICS_TASK, true)
                    // user can get stats only for organizations which have canManageOrganization
                    const administratorStatistics = new UserDailyStatistics(userData.client.user.id)
                    await administratorStatistics.loadStatistics()
                    const administratorResult =  await administratorStatistics.loadStatistics()

                    expect(administratorResult.incidents.water).toHaveLength(4)
                    expect(administratorResult.incidents.water).toEqual(expect.arrayContaining([
                        ...incidentsForAllPropertyToTests
                            .filter((item) => item.incident.organization.id === userData.organizationWithAccess1.data.id
                                || item.incident.organization.id === userData.organizationWithAccess1.data.id)
                            .map((item) => expect.objectContaining({
                                workStart: item.incident.workStart ? dayjs(item.incident.workStart).toDate() : null,
                                workFinish: item.incident.workFinish ? dayjs(item.incident.workFinish).toDate() : null,
                                hasAllProperties: item.incident.hasAllProperties,
                            })),
                        ...incidentsForOnePropertyToTests
                            .filter((item) => item.incident.organization.id === userData.organizationWithAccess1.data.id
                                || item.incident.organization.id === userData.organizationWithAccess1.data.id)
                            .map((item) => expect.objectContaining({
                                workStart: item.incident.workStart ? dayjs(item.incident.workStart).toDate() : null,
                                workFinish: item.incident.workFinish ? dayjs(item.incident.workFinish).toDate() : null,
                                count: 1,
                                addresses: [item.property.address],
                            })),
                    ]))

                    // just employee can not get stats
                    const justEmployeeStatistics = new UserDailyStatistics(justEmployeeClient.user.id)
                    await justEmployeeStatistics.loadStatistics()
                    const justEmployeeResult =  await justEmployeeStatistics.loadStatistics()

                    expect(justEmployeeResult.incidents.water).toHaveLength(0)


                    setFeatureFlag(SEND_DAILY_STATISTICS_TASK, false)
                    // user can not get stats if feature flag enabled
                    const administratorStatistics2 = new UserDailyStatistics(userData.client.user.id)
                    await administratorStatistics2.loadStatistics()
                    const administratorResult2 =  await administratorStatistics2.loadStatistics()

                    expect(administratorResult2.incidents.water).toHaveLength(0)
                })
            })
        })
    })

    describe('"sendDailyMessageToUserSafely" should correct work', () => {
        test('should send only one message to user and message should have meta with statistics data', async () => {
            const administratorClient = await makeClientWithProperty()

            const [inProgress] = await createTestTicket(administratorClient, administratorClient.organization, administratorClient.property, {
                status: { connect: { id: STATUS_IDS.IN_PROGRESS } },
                assignee: { connect: { id: administratorClient.user.id } },
                executor: { connect: { id: administratorClient.user.id } },
            })
            const [isEmergency] = await createTestTicket(administratorClient, administratorClient.organization, administratorClient.property, {
                status: { connect: { id: STATUS_IDS.OPEN } },
                isEmergency: true,
                assignee: { connect: { id: administratorClient.user.id } },
                executor: { connect: { id: administratorClient.user.id } },
            })
            let [isReturned] = await createTestTicket(administratorClient, administratorClient.organization, administratorClient.property, {
                status: { connect: { id: STATUS_IDS.COMPLETED } },
                assignee: { connect: { id: administratorClient.user.id } },
                executor: { connect: { id: administratorClient.user.id } },
            });
            [isReturned] = await updateTestTicket(administratorClient, isReturned.id, {
                status: { connect: { id: STATUS_IDS.OPEN } },
            })
            const [isExpired] = await createTestTicket(administratorClient, administratorClient.organization, administratorClient.property, {
                status: { connect: { id: STATUS_IDS.OPEN } },
                deadline: dayjs().subtract(10, 'minutes'),
                assignee: { connect: { id: administratorClient.user.id } },
                executor: { connect: { id: administratorClient.user.id } },
            })
            const [withoutAssignee] = await createTestTicket(administratorClient, administratorClient.organization, administratorClient.property, {
                status: { connect: { id: STATUS_IDS.OPEN } },
                executor: { connect: { id: administratorClient.user.id } },
            })

            const [actualWaterIncidentSoonForAllProperties] = await createTestIncident(administratorClient, administratorClient.organization, {
                details: 'actualWaterIncidentSoonForAllProperties',
                workStart: dayjs().add(12, 'hours'),
                workFinish: dayjs().add(13, 'hours'),
                hasAllProperties: true,
            })
            await createTestIncidentClassifierIncident(administratorClient, actualWaterIncidentSoonForAllProperties, faker.helpers.arrayElement(allowedIncidentClassifiers))

            const [actualWaterIncidentSoonForOneProperty] = await createTestIncident(administratorClient, administratorClient.organization, {
                details: 'actualWaterIncidentSoonForOneProperty',
                workStart: dayjs().add(2, 'minute'),
                workFinish: dayjs().add(2, 'days'),
            })
            await createTestIncidentClassifierIncident(administratorClient, actualWaterIncidentSoonForOneProperty, faker.helpers.arrayElement(allowedIncidentClassifiers))
            await createTestIncidentProperty(administratorClient, actualWaterIncidentSoonForOneProperty, administratorClient.property)

            setFeatureFlag(SEND_DAILY_STATISTICS_TASK, true)
            const currentDate = dayjs().toISOString()
            const { keystone: context } = getSchemaCtx('User')
            await sendDailyMessageToUserSafely(context, { ...administratorClient.user, email: administratorClient.userAttrs.email }, currentDate)
            await sendDailyMessageToUserSafely(context, { ...administratorClient.user, email: administratorClient.userAttrs.email }, currentDate)

            const uniqKey = `send_daily_statistics_${administratorClient.user.id}_${dayjs(currentDate).format('DD-MM-YYYY')}`
            let message = await Message.getOne(admin, { uniqKey })

            const getDate = (incident) => {
                const EMPTY_LINE = '—'
                const dateStart = dayjs(incident.workStart).format('DD-MM-YYYY')
                const dateFinish = incident.workFinish ? dayjs(incident.workFinish).format('DD-MM-YYYY') : null
                if (dateStart === dateFinish) {
                    return dateStart
                } else {
                    return [dateStart, dateFinish].filter(Boolean).join(` ${EMPTY_LINE} `)
                }
            }
            expect(message).toBeDefined()
            expect(message).toEqual(expect.objectContaining({
                email: administratorClient.userAttrs.email,
                type: SEND_DAILY_STATISTICS_MESSAGE_TYPE,
                meta: expect.objectContaining({
                    dv: 1,
                    data: {
                        date: dayjs(currentDate).format('DD.MM.YY'),
                        tickets: {
                            inProgress: { total: 1, details: `${administratorClient.organization.name} - 1` },
                            isEmergency: { total: 1, details: `${administratorClient.organization.name} - 1` },
                            isReturned: { total: 1, details: `${administratorClient.organization.name} - 1` },
                            isExpired: { total: 1, details: `${administratorClient.organization.name} - 1` },
                            withoutEmployee: { total: 1, details: `${administratorClient.organization.name} - 1` },
                        },
                        incidents: {
                            water: `${getDate(actualWaterIncidentSoonForOneProperty)} - ${administratorClient.property.address}; ${getDate(actualWaterIncidentSoonForAllProperties)} - ${i18n('notification.messages.SEND_DAILY_STATISTICS.email.allProperties', { locale: administratorClient.user.locale, meta: { organization: administratorClient.organization.name } })}`,
                        },
                    },
                    attachingData: {
                        organizationIds: [administratorClient.organization.id],
                        userId: administratorClient.user.id,
                        uniqKey,
                        statisticsData: {
                            tickets: {
                                inProgress: 1,
                                isEmergency: 1,
                                isExpired: 1,
                                isReturned: 1,
                                withoutEmployee: 1,
                            },
                            incidents: {
                                water: 2,
                            },
                        },
                    },
                }),
            }))

            await waitFor(async () => {
                message = await Message.getOne(admin, { uniqKey })
                expect(message.status).toEqual('sent')
            })
        })

        test('should not send message if statistics is empty', async () => {
            const administratorClient = await makeClientWithProperty()

            setFeatureFlag(SEND_DAILY_STATISTICS_TASK, true)
            const currentDate = dayjs().toISOString()
            const { keystone: context } = getSchemaCtx('User')
            const res = await sendDailyMessageToUserSafely(context, { ...administratorClient.user, email: administratorClient.userAttrs.email }, currentDate)
            expect(res).toBe('statistics-is-empty')

            const message = await Message.getOne(admin, {
                uniqKey: `send_daily_statistics_${administratorClient.user.id}_${dayjs(currentDate).format('DD-MM-YYYY')}`,
            })
            expect(message).toBeUndefined()
        })
    })
})
