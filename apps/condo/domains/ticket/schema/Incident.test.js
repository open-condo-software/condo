/**
 * Generated by `createschema ticket.Incident 'organization; number; details:Text; status; textForResident:Text; workStart:DateTimeUtc; workFinish:DateTimeUtc; isScheduled:Checkbox; isEmergency:Checkbox; hasAllProperties:Checkbox;'`
 */

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { makeLoggedInAdminClient, makeClient, expectToThrowGQLError } = require('@open-condo/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
} = require('@open-condo/keystone/test.utils')

const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')
const { INCIDENT_STATUS_ACTUAL, INCIDENT_STATUS_NOT_ACTUAL } = require('@condo/domains/ticket/constants/incident')
const { ERRORS: INCIDENT_ERRORS } = require('@condo/domains/ticket/schema/Incident')
const { Incident, createTestIncident, updateTestIncident } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser, makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')

const INCIDENT_PAYLOAD = {
    details: faker.lorem.sentence(),
    workStart: faker.date.recent().toISOString(),
}

describe('Incident', () => {
    let admin, support, employeeUser, employeeWithoutCanReadIncidentsUser, notEmployeeUser, anonymous, organization, incidentByAdmin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeClientWithSupportUser()
        employeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
        employeeWithoutCanReadIncidentsUser = await makeClientWithNewRegisteredAndLoggedInUser()
        anonymous = await makeClient()

        const [testOrganization] = await createTestOrganization(admin)
        organization = testOrganization

        const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
            canManageIncidents: true,
            canReadIncidents: true,
        })
        await createTestOrganizationEmployee(admin, organization, employeeUser.user, role)
        const [roleWithoutCanReadIncidents] = await createTestOrganizationEmployeeRole(admin, organization, {
            canReadIncidents: false,
        })
        await createTestOrganizationEmployee(admin, organization, employeeWithoutCanReadIncidentsUser.user, roleWithoutCanReadIncidents)

        notEmployeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
        const [secondTestOrganization] = await createTestOrganization(admin)
        const [secondRole] = await createTestOrganizationEmployeeRole(admin, secondTestOrganization)
        await createTestOrganizationEmployee(admin, secondTestOrganization, notEmployeeUser.user, secondRole)
    })
    beforeEach(async () => {
        const [testIncident] = await createTestIncident(admin, organization, INCIDENT_PAYLOAD)
        incidentByAdmin = testIncident
    })
    describe('Accesses', () => {
        describe('Admin', () => {
            test('can create', async () => {
                expect(incidentByAdmin).toBeDefined()
                expect(incidentByAdmin).toHaveProperty('organization.id', organization.id)
                expect(incidentByAdmin).toHaveProperty('details', INCIDENT_PAYLOAD.details)
                expect(incidentByAdmin).toHaveProperty('workStart')
                expect(incidentByAdmin).toHaveProperty('status', INCIDENT_STATUS_ACTUAL)
            })
            test('can read', async () => {
                const incident = await Incident.getOne(admin, { id: incidentByAdmin.id }, { sortBy: ['updatedAt_DESC'] })
                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('id', incidentByAdmin.id)
            })
            test('can update', async () => {
                const [incident, attrs] = await updateTestIncident(admin, incidentByAdmin.id, { details: faker.lorem.sentence() })
                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('details', attrs.details)
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await Incident.delete(admin, incidentByAdmin.id)
                })
            })
        })

        describe('Support', () => {
            test('can create', async () => {
                const [incident] = await createTestIncident(support, organization, INCIDENT_PAYLOAD)
                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('organization.id', organization.id)
                expect(incident).toHaveProperty('details', INCIDENT_PAYLOAD.details)
                expect(incident).toHaveProperty('workStart')
                expect(incident).toHaveProperty('status', INCIDENT_STATUS_ACTUAL)
            })
            test('can read', async () => {
                const incident = await Incident.getOne(support, { id: incidentByAdmin.id }, { sortBy: ['updatedAt_DESC'] })
                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('id', incidentByAdmin.id)
            })
            test('can update', async () => {
                const [incident, attrs] = await updateTestIncident(support, incidentByAdmin.id, { details: faker.lorem.sentence() })
                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('details', attrs.details)
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await Incident.delete(support, incidentByAdmin.id)
                })
            })
        })

        describe('Employee', () => {
            test('can create', async () => {
                const [incident] = await createTestIncident(employeeUser, organization, INCIDENT_PAYLOAD)
                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('organization.id', organization.id)
                expect(incident).toHaveProperty('details', INCIDENT_PAYLOAD.details)
                expect(incident).toHaveProperty('status', INCIDENT_STATUS_ACTUAL)
                expect(incident).toHaveProperty('workStart')
                expect(incident).toHaveProperty('workFinish', null)
                expect(incident).toHaveProperty('workType', null)
                expect(incident).toHaveProperty('hasAllProperties', false)
                expect(incident).toHaveProperty('number')
                expect(incident.number).not.toBeNull()
            })
            test('can read by employee with canReadIncidents', async () => {
                const incident = await Incident.getOne(employeeUser, { id: incidentByAdmin.id })

                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('id', incidentByAdmin.id)
            })
            test('can not read by employee without canReadIncidents', async () => {
                const incident = await Incident.getOne(employeeWithoutCanReadIncidentsUser, { id: incidentByAdmin.id })

                expect(incident).toBeUndefined()
            })
            test('can update', async () => {
                const [incident, attrs] = await updateTestIncident(employeeUser, incidentByAdmin.id, { details: faker.lorem.sentence() })
                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('details', attrs.details)
            })
            test('can\'t update from not his organization', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canManageIncidents: false })
                await createTestOrganizationEmployee(admin, organization, client.user, role)

                const [otherOrganization] = await createTestOrganization(admin)
                const [roleInOtherOrganization] = await createTestOrganizationEmployeeRole(admin, otherOrganization, { canManageIncidents: true })
                await createTestOrganizationEmployee(admin, otherOrganization, client.user, roleInOtherOrganization)

                const [incident] = await createTestIncident(admin, organization, INCIDENT_PAYLOAD)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestIncident(client, incident.id, { details: faker.lorem.sentence() })
                })
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await Incident.delete(employeeUser, incidentByAdmin.id)
                })
            })
        })

        describe('Not employee', () => {
            test('can\'t create', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestIncident(notEmployeeUser, organization, INCIDENT_PAYLOAD)
                })
            })
            test('can\'t read', async () => {
                const incidents = await Incident.getAll(notEmployeeUser, { id: incidentByAdmin.id }, { sortBy: ['updatedAt_DESC'], first: 10 })
                expect(incidents).toHaveLength(0)
            })
            test('can\'t update', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestIncident(notEmployeeUser, incidentByAdmin.id, INCIDENT_PAYLOAD)
                })
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await Incident.delete(notEmployeeUser, incidentByAdmin.id)
                })
            })
        })

        describe('Anonymous', () => {
            test('can\'t create', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestIncident(anonymous, organization, INCIDENT_PAYLOAD)
                })
            })
            test('can\'t read', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await Incident.getOne(anonymous, { id: incidentByAdmin.id }, { sortBy: ['updatedAt_DESC'] })
                })
            })
            test('can\'t update', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestIncident(anonymous, incidentByAdmin.id, INCIDENT_PAYLOAD)
                })
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await Incident.delete(anonymous, incidentByAdmin.id)
                })
            })
        })
    })

    describe('Validations', () => {
        describe('fields', () => {
            test('workFinish should be late then workStart', async () => {
                const [incident, attrs] = await updateTestIncident(admin, incidentByAdmin.id, {
                    workFinish: dayjs(incidentByAdmin.workStart).add(1, 'minute').toISOString(),
                })
                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('workFinish', attrs.workFinish)
            })
            test('workStart and workFinish can be equal', async () => {
                const [incident] = await updateTestIncident(admin, incidentByAdmin.id, {
                    workFinish: dayjs(incidentByAdmin.workStart).toISOString(),
                })
                expect(incident).toBeDefined()
                expect(incident).toHaveProperty('workFinish', incidentByAdmin.workStart)
            })
            test('workFinish should not be early then workStart when update workFinish', async () => {

                await expectToThrowGQLError(
                    async () => await updateTestIncident(admin, incidentByAdmin.id, {
                        workFinish: dayjs(incidentByAdmin.workStart).subtract(1, 'minute').toISOString(),
                    }),
                    INCIDENT_ERRORS.WORK_FINISHED_EARLIER_THEN_WORK_STARTED,
                )
            })
            test('workFinish should not be early then workStart when update workStart', async () => {
                const [incident] = await createTestIncident(admin, organization, {
                    ...INCIDENT_PAYLOAD,
                    workStart: dayjs('2023-01-01').toISOString(),
                    workFinish: dayjs('2023-01-02').toISOString(),
                })
                await expectToThrowGQLError(
                    async () => await updateTestIncident(admin, incident.id, { workStart: dayjs('2023-01-03').toISOString() }),
                    INCIDENT_ERRORS.WORK_FINISHED_EARLIER_THEN_WORK_STARTED,
                )
            })
            test('"workFinish" field should be specified if the incident has status not actual', async () => {
                const [testIncident] = await createTestIncident(admin, organization, INCIDENT_PAYLOAD)

                expect(testIncident.workFinish).toBeNull()
                expect(testIncident.status).toEqual(INCIDENT_STATUS_ACTUAL)

                await expectToThrowGQLError(async () => {
                    await updateTestIncident(admin, testIncident.id, {
                        status: INCIDENT_STATUS_NOT_ACTUAL,
                    })
                }, INCIDENT_ERRORS.WORK_FINISH_MUST_BE_SPECIFIED_IF_NOT_ACTUAL_STATUS)

                expect(testIncident.workFinish).toBeNull()
                expect(testIncident.status).toEqual(INCIDENT_STATUS_ACTUAL)

                const [updatedIncident, attrs] = await updateTestIncident(admin, testIncident.id, {
                    status: INCIDENT_STATUS_NOT_ACTUAL,
                    workFinish: dayjs(faker.date.soon(7, testIncident.workStart)).set('seconds', 0).set('milliseconds', 0).toISOString(),
                })

                expect(updatedIncident.workFinish).toEqual(attrs.workFinish)
                expect(updatedIncident.status).toEqual(INCIDENT_STATUS_NOT_ACTUAL)
            })
        })
    })
})
