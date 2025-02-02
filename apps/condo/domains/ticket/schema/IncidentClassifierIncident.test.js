/**
 * Generated by `createschema ticket.IncidentClassifierIncident 'incident:Relationship:Incident:CASCADE; classifier:Relationship:IncidentClassifier:PROTECT;'`
 */

const { faker } = require('@faker-js/faker')

const { makeLoggedInAdminClient, makeClient } = require('@open-condo/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowUniqueConstraintViolationError,
} = require('@open-condo/keystone/test.utils')

const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')
const {
    createTestIncident,
    IncidentClassifierIncident,
    createTestIncidentClassifierIncident,
    updateTestIncidentClassifierIncident,
} = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser, makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')


const DELETED_PAYLOAD = { deletedAt: 'true' }
const INCIDENT_PAYLOAD = {
    details: faker.lorem.sentence(),
    workStart: faker.date.recent().toISOString(),
}
const CLASSIFIER = {
    id: 'de707e0c-a847-4e10-8838-b6a914223a0a',
}

describe('IncidentClassifierIncident', () => {
    let admin, support, employeeUser, notEmployeeUser, anonymous, organization, incidentByAdmin, incidentClassifierByAdmin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeClientWithSupportUser()
        employeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
        anonymous = await makeClient()

        const [testOrganization] = await createTestOrganization(admin)
        organization = testOrganization

        const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
            canManageIncidents: true,
        })

        await createTestOrganizationEmployee(admin, organization, employeeUser.user, role)

        notEmployeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
        const [secondTestOrganization] = await createTestOrganization(admin)
        const [secondRole] = await createTestOrganizationEmployeeRole(admin, secondTestOrganization)
        await createTestOrganizationEmployee(admin, secondTestOrganization, notEmployeeUser.user, secondRole)
    })
    beforeEach(async () => {
        const [testIncident] = await createTestIncident(admin, organization, INCIDENT_PAYLOAD)
        incidentByAdmin = testIncident

        const [testIncidentClassifier] = await createTestIncidentClassifierIncident(admin, incidentByAdmin, CLASSIFIER)
        incidentClassifierByAdmin = testIncidentClassifier
    })
    describe('Accesses', () => {
        describe('Admin', () => {
            test('can create', async () => {
                expect(incidentClassifierByAdmin).toBeDefined()
                expect(incidentClassifierByAdmin).toHaveProperty('classifier.id', CLASSIFIER.id)
                expect(incidentClassifierByAdmin).toHaveProperty('incident.id', incidentByAdmin.id)
            })
            test('can read', async () => {
                const incidentClassifier = await IncidentClassifierIncident.getOne(admin, { id: incidentClassifierByAdmin.id }, { sortBy: ['updatedAt_DESC'] })
                expect(incidentClassifier).toBeDefined()
                expect(incidentClassifier).toHaveProperty('id', incidentClassifierByAdmin.id)
            })
            test('can\'t update', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestIncidentClassifierIncident(admin, incidentClassifierByAdmin.id, {})
                })
            })
            test('can soft delete', async () => {
                const [incidentClassifier] = await updateTestIncidentClassifierIncident(admin, incidentClassifierByAdmin.id, DELETED_PAYLOAD)
                expect(incidentClassifier).toBeDefined()
                expect(incidentClassifier).toHaveProperty('id', incidentClassifierByAdmin.id)
                expect(incidentClassifier).toHaveProperty('deletedAt')
                expect(incidentClassifier.deletedAt).not.toBeNull()
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await IncidentClassifierIncident.delete(admin, incidentClassifierByAdmin.id)
                })
            })
        })

        describe('Support', () => {
            test('can create', async () => {
                const [incident] = await createTestIncident(admin, organization, INCIDENT_PAYLOAD)
                const [incidentClassifier] = await createTestIncidentClassifierIncident(support, incident, CLASSIFIER)
                expect(incidentClassifier).toBeDefined()
                expect(incidentClassifier).toHaveProperty('classifier.id', CLASSIFIER.id)
                expect(incidentClassifier).toHaveProperty('incident.id', incident.id)
            })
            test('can read', async () => {
                const incidentClassifier = await IncidentClassifierIncident.getOne(support, { id: incidentClassifierByAdmin.id }, { sortBy: ['updatedAt_DESC'] })
                expect(incidentClassifier).toBeDefined()
                expect(incidentClassifier).toHaveProperty('id', incidentClassifierByAdmin.id)
            })
            test('can\'t update', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestIncidentClassifierIncident(support, incidentClassifierByAdmin.id, {})
                })
            })
            test('can soft delete', async () => {
                const [incidentClassifier] = await updateTestIncidentClassifierIncident(support, incidentClassifierByAdmin.id, DELETED_PAYLOAD)
                expect(incidentClassifier).toBeDefined()
                expect(incidentClassifier).toHaveProperty('id', incidentClassifierByAdmin.id)
                expect(incidentClassifier).toHaveProperty('deletedAt')
                expect(incidentClassifier.deletedAt).not.toBeNull()
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await IncidentClassifierIncident.delete(support, incidentClassifierByAdmin.id)
                })
            })
        })

        describe('Employee', () => {
            test('can create', async () => {
                const [incident] = await createTestIncident(admin, organization, INCIDENT_PAYLOAD)
                const [incidentClassifier] = await createTestIncidentClassifierIncident(employeeUser, incident, CLASSIFIER)
                expect(incidentClassifier).toBeDefined()
                expect(incidentClassifier).toHaveProperty('classifier.id', CLASSIFIER.id)
                expect(incidentClassifier).toHaveProperty('incident.id', incident.id)
                expect(incidentClassifier).toHaveProperty('organization.id', organization.id)
            })
            test('can read', async () => {
                const incidentClassifier = await IncidentClassifierIncident.getOne(employeeUser, { id: incidentClassifierByAdmin.id }, { sortBy: ['updatedAt_DESC'] })
                expect(incidentClassifier).toBeDefined()
                expect(incidentClassifier).toHaveProperty('id', incidentClassifierByAdmin.id)
            })
            test('can\'t update', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestIncidentClassifierIncident(employeeUser, incidentClassifierByAdmin.id, {})
                })
            })
            test('can soft delete', async () => {
                const [incidentClassifier] = await updateTestIncidentClassifierIncident(employeeUser, incidentClassifierByAdmin.id, DELETED_PAYLOAD)
                expect(incidentClassifier).toBeDefined()
                expect(incidentClassifier).toHaveProperty('id', incidentClassifierByAdmin.id)
                expect(incidentClassifier).toHaveProperty('deletedAt')
                expect(incidentClassifier.deletedAt).not.toBeNull()
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await IncidentClassifierIncident.delete(employeeUser, incidentClassifierByAdmin.id)
                })
            })
        })

        describe('Not employee', () => {
            test('can\'t create', async () => {
                const [incident] = await createTestIncident(admin, organization, INCIDENT_PAYLOAD)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestIncidentClassifierIncident(notEmployeeUser, incident, CLASSIFIER)
                })
            })
            test('can\'t read', async () => {
                const incidents = await IncidentClassifierIncident.getAll(notEmployeeUser, { id: incidentClassifierByAdmin.id }, { sortBy: ['updatedAt_DESC'], first: 10 })
                expect(incidents).toHaveLength(0)
            })
            test('can\'t update', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestIncidentClassifierIncident(notEmployeeUser, incidentClassifierByAdmin.id, DELETED_PAYLOAD)
                })
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await IncidentClassifierIncident.delete(notEmployeeUser, incidentClassifierByAdmin.id)
                })
            })
        })

        describe('Anonymous', () => {
            test('can\'t create', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestIncidentClassifierIncident(anonymous, incidentByAdmin, CLASSIFIER)
                })
            })
            test('can\'t read', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await IncidentClassifierIncident.getOne(anonymous, { id: incidentClassifierByAdmin.id }, { sortBy: ['updatedAt_DESC'] })
                })
            })
            test('can\'t update', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestIncidentClassifierIncident(anonymous, incidentClassifierByAdmin.id, {})
                })
            })
            test('can\'t delete', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await IncidentClassifierIncident.delete(anonymous, incidentClassifierByAdmin.id)
                })
            })
        })
    })

    describe('Validations', () => {
        test('Constraint: unique incident + classifier', async () => {
            await expectToThrowUniqueConstraintViolationError(async () => {
                await createTestIncidentClassifierIncident(admin, incidentByAdmin, CLASSIFIER)
            }, 'incident_classifier_unique_incident_and_classifier')
        })
    })
})
