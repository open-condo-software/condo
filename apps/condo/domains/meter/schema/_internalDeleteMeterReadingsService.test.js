/**
 * Generated by `createservice meter.InternalDeleteMeterReadingsService --type mutations`
 */

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowAccessDeniedErrorToResult,
    expectToThrowGQLError,
} = require('@open-condo/keystone/test.utils')
const { expectToThrowAuthenticationErrorToResult } = require('@open-condo/keystone/test.utils')

const { sleep } = require('@condo/domains/common/utils/sleep')
const {
    COLD_WATER_METER_RESOURCE_ID,
    HOT_WATER_METER_RESOURCE_ID,
    METER_READING_SOURCE_INTERNAL_IMPORT_TYPE,
    METER_READING_SOURCE_CRM_TYPE,
    METER_READING_SOURCE_MOBILE_RESIDENT_APP_TYPE,
} = require('@condo/domains/meter/constants/constants')
const {
    _internalDeleteMeterReadingsByTestClient,
    createTestMeter,
    createTestMeterReading,
    MeterResource,
    createTestMeterReadingSource,
    MeterReading,
    Meter,
} = require('@condo/domains/meter/utils/testSchema')
const { makeEmployeeUserClientWithAbilities } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestResident } = require('@condo/domains/resident/utils/testSchema')
const {
    makeClientWithSupportUser,
    makeClientWithResidentUser,
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./_internalDeleteMeterReadingsService')


const DATE_FORMAT = 'DD.MM.YYYY HH:mm:ss'

describe('_internalDeleteMeterReadingsService', () => {
    let admin, support, employee, resident, serviceUser, anonymous, organization, property, resource, condoImportSource,
        meter, meterReading, startDateTimeFormatted, endDateTimeFormatted, payload, startDateTimeIso, endDateTimeIso

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeClientWithSupportUser()
        anonymous = await makeClient()
        serviceUser = await makeClientWithServiceUser()

        const employeeClient = await makeEmployeeUserClientWithAbilities({ canManageMeters: true, canReadMeters: true })
        employee = employeeClient
        organization = employeeClient.organization
        property = employeeClient.property

        resident = await makeClientWithResidentUser()
        const unitName = faker.random.alphaNumeric(8)
        await createTestResident(admin, resident.user, property, {
            unitName,
        })

        const [testResource] = await MeterResource.getAll(admin, { id: COLD_WATER_METER_RESOURCE_ID })
        resource = testResource

        const [source] = await createTestMeterReadingSource(admin, {
            type: METER_READING_SOURCE_INTERNAL_IMPORT_TYPE,
            name: faker.name.suffix(),
        })
        condoImportSource = source
    })

    beforeEach(async () => {
        startDateTimeIso = dayjs().toISOString()
        startDateTimeFormatted = dayjs(startDateTimeIso).format(DATE_FORMAT)
        const [createdMeter] = await createTestMeter(admin, organization, property, resource, {})
        meter = createdMeter
        const [createdMeterReading] =  await createTestMeterReading(admin, meter, condoImportSource)
        meterReading = createdMeterReading
        endDateTimeIso = dayjs().toISOString()
        endDateTimeFormatted = dayjs(endDateTimeIso).format(DATE_FORMAT)
        payload = {
            dv: 1,
            sender: { dv: 1, fingerprint: faker.lorem.slug(5).slice(0, 42) },
            organizationId: organization.id,
            startDateTime: startDateTimeFormatted,
            endDateTime: endDateTimeFormatted,
        }
    })

    afterEach(async () => {
        const metersToDelete = await Meter.getAll(admin, {
            organization: { id: organization.id },
            deletedAt: null,
        })

        for (const meter of metersToDelete) {
            await Meter.softDelete(admin, meter.id)
        }
    })

    describe('Accesses', () => {
        describe('Admin', () => {
            test('Can call mutation', async () => {
                const [result] = await _internalDeleteMeterReadingsByTestClient(admin, payload)
                expect(result).toEqual(expect.objectContaining({
                    status: 'success',
                    toDelete: 1,
                    deleted: 1,
                }))
            })
        })

        describe('Support', () => {
            test('Can call mutation', async () => {
                const [result] = await _internalDeleteMeterReadingsByTestClient(support, payload)
                expect(result).toEqual(expect.objectContaining({
                    status: 'success',
                    toDelete: 1,
                    deleted: 1,
                }))
            })
        })

        describe('Staff', () => {
            test('Can not call mutation', async () => {
                await expectToThrowAccessDeniedErrorToResult(async () => {
                    await _internalDeleteMeterReadingsByTestClient(employee, payload)
                })
            })
        })

        describe('Resident', () => {
            test('Can not call mutation', async () => {
                await expectToThrowAccessDeniedErrorToResult(async () => {
                    await _internalDeleteMeterReadingsByTestClient(resident, payload)
                })
            })
        })

        describe('Service user', () => {
            test('Can not call mutation', async () => {
                await expectToThrowAccessDeniedErrorToResult(async () => {
                    await _internalDeleteMeterReadingsByTestClient(serviceUser, payload)
                })
            })
        })

        describe('Anonymous', () => {
            test('Can not call mutation', async () => {
                await expectToThrowAuthenticationErrorToResult(async () => {
                    await _internalDeleteMeterReadingsByTestClient(anonymous, payload)
                })
            })
        })
    })

    describe('Validations', () => {
        describe('Fields', () => {
            describe('startDateTime', () => {
                test('must be in the format DD.MM.YYYY HH:mm:ss', async () => {
                    await expectToThrowGQLError(async () => {
                        await _internalDeleteMeterReadingsByTestClient(support, {
                            ...payload,
                            startDateTime: startDateTimeIso,
                        })
                    }, ERRORS.INVALID_START_DATE_TIME, 'result')
                    const [result] = await _internalDeleteMeterReadingsByTestClient(support, {
                        ...payload,
                        startDateTime: startDateTimeFormatted,
                    })
                    expect(result).toHaveProperty('status', 'success')
                })

                test('must not be greater than endDateTime', async () => {
                    await expectToThrowGQLError(async () => {
                        await _internalDeleteMeterReadingsByTestClient(support, {
                            ...payload,
                            startDateTime: dayjs(endDateTimeIso).add(faker.datatype.number({ min: 1 }), 'day').format(DATE_FORMAT),
                        })
                    }, ERRORS.INVALID_PERIOD, 'result')
                })
            })

            describe('endDateTime', () => {
                test('must be in the format DD.MM.YYYY HH:mm:ss', async () => {
                    await expectToThrowGQLError(async () => {
                        await _internalDeleteMeterReadingsByTestClient(support, {
                            ...payload,
                            endDateTime: endDateTimeIso,
                        })
                    }, ERRORS.INVALID_END_DATE_TIME, 'result')
                    const [result] = await _internalDeleteMeterReadingsByTestClient(support, {
                        ...payload,
                        endDateTime: endDateTimeFormatted,
                    })
                    expect(result).toHaveProperty('status', 'success')
                })
            })
        })
    })

    describe('Basic logic', () => {
        test('Readings for all properties in organization should be deleted if no "propertyIds" and "resourcesIds" specified', async () => {
            const {
                organization: organization2,
                property: property2_1,
            } = await makeEmployeeUserClientWithAbilities({ canManageMeters: true, canReadMeters: true })

            const [property1_2] = await createTestProperty(admin, organization)
            const [meter1_2] = await createTestMeter(admin, organization, property1_2, resource, {})
            const [meterReading1_2] = await createTestMeterReading(admin, meter1_2, condoImportSource)

            const [meter2_1] = await createTestMeter(admin, organization2, property2_1, resource, {})
            const [meterReading2_1] = await createTestMeterReading(admin, meter2_1, condoImportSource)

            const [result] = await _internalDeleteMeterReadingsByTestClient(support, {
                ...payload,
                endDateTime: dayjs().format(DATE_FORMAT),
            })
            expect(result).toEqual(expect.objectContaining({
                status: 'success',
                toDelete: 2,
                deleted: 2,
            }))
            const readings = await MeterReading.getAll(admin, {
                id_in: [meterReading.id, meterReading1_2.id, meterReading2_1.id],
                deletedAt: null,
            })
            expect(readings).toHaveLength(1)
            expect(readings[0].id).toBe(meterReading2_1.id)
        })

        test('Readings should be deleted only in those properties that were specified in "propertyIds"', async () => {
            const [property2] = await createTestProperty(admin, organization)
            const [meter2] = await createTestMeter(admin, organization, property2, resource, {})
            const [meterReading2] = await createTestMeterReading(admin, meter2, condoImportSource)
            const [meterReading3] = await createTestMeterReading(admin, meter2, condoImportSource, { value1: meterReading2.value1 })

            const [result] = await _internalDeleteMeterReadingsByTestClient(support, {
                ...payload,
                propertyIds: [property2.id],
                endDateTime: dayjs().format(DATE_FORMAT),
            })
            expect(result).toEqual(expect.objectContaining({
                status: 'success',
                toDelete: 2,
                deleted: 2,
            }))
            const readings = await MeterReading.getAll(admin, {
                id_in: [meterReading.id, meterReading2.id, meterReading3.id],
                deletedAt: null,
            })
            expect(readings).toHaveLength(1)
            expect(readings[0].id).toBe(meterReading.id)
        })

        test('Readings should be deleted only for resources that were specified in "resourcesIds"', async () => {
            const [resource2] = await MeterResource.getAll(admin, { id: HOT_WATER_METER_RESOURCE_ID })
            const [meter2] = await createTestMeter(admin, organization, property, resource2, {})
            const [meterReading2] = await createTestMeterReading(admin, meter2, condoImportSource)
            const [meterReading3] = await createTestMeterReading(admin, meter2, condoImportSource, { value1: meterReading2.value1 })

            const [result] = await _internalDeleteMeterReadingsByTestClient(support, {
                ...payload,
                resourcesIds: [resource2.id],
                endDateTime: dayjs().format(DATE_FORMAT),
            })
            expect(result).toEqual(expect.objectContaining({
                status: 'success',
                toDelete: 2,
                deleted: 2,
            }))
            const readings = await MeterReading.getAll(admin, {
                id_in: [meterReading.id, meterReading2.id, meterReading3.id],
                deletedAt: null,
            })
            expect(readings).toHaveLength(1)
            expect(readings[0].id).toBe(meterReading.id)
        })

        test('Readings should be deleted only in properties that were specified in "propertyIds" and for resources that were specified in "resourcesIds"', async () => {
            const [property2] = await createTestProperty(admin, organization)
            const [resource2] = await MeterResource.getAll(admin, { id: HOT_WATER_METER_RESOURCE_ID })
            const [meter2] = await createTestMeter(admin, organization, property2, resource2, {})
            const [meterReading2] = await createTestMeterReading(admin, meter2, condoImportSource)
            const [meterReading3] = await createTestMeterReading(admin, meter2, condoImportSource, { value1: meterReading2.value1 })

            // Be sure that we delete nothing if no meters contains passed property and resource
            const [result1] = await _internalDeleteMeterReadingsByTestClient(support, {
                ...payload,
                propertyIds: [property.id],
                resourcesIds: [resource2.id],
                endDateTime: dayjs().format(DATE_FORMAT),
            })
            expect(result1).toEqual(expect.objectContaining({
                status: 'success',
                toDelete: 0,
                deleted: 0,
            }))

            const [result2] = await _internalDeleteMeterReadingsByTestClient(support, {
                ...payload,
                propertyIds: [property2.id],
                resourcesIds: [resource.id],
                endDateTime: dayjs().format(DATE_FORMAT),
            })
            expect(result2).toEqual(expect.objectContaining({
                status: 'success',
                toDelete: 0,
                deleted: 0,
            }))

            // Be sure that we delete only meter readings for meters with both: property and resource
            const [result3] = await _internalDeleteMeterReadingsByTestClient(support, {
                ...payload,
                propertyIds: [property2.id],
                resourcesIds: [resource2.id],
                endDateTime: dayjs().format(DATE_FORMAT),
            })
            expect(result3).toEqual(expect.objectContaining({
                status: 'success',
                toDelete: 2,
                deleted: 2,
            }))

            const readings = await MeterReading.getAll(admin, {
                id_in: [meterReading.id, meterReading2.id, meterReading3.id],
                deletedAt: null,
            })
            expect(readings).toHaveLength(1)
            expect(readings[0].id).toBe(meterReading.id)
        })

        test('Readings only for specified period should be deleted', async () => {
            await sleep(1200)
            const startDateTime = dayjs().format(DATE_FORMAT)
            const [meterReading2] = await createTestMeterReading(admin, meter, condoImportSource, { value1: meterReading.value1 })
            const [meterReading3] = await createTestMeterReading(admin, meter, condoImportSource, { value1: meterReading2.value1 })
            const endDateTime = dayjs().format(DATE_FORMAT)
            await sleep(1200)
            const [meterReading4] = await createTestMeterReading(admin, meter, condoImportSource, { value1: meterReading3.value1 })

            const [result] = await _internalDeleteMeterReadingsByTestClient(support, {
                ...payload,
                startDateTime,
                endDateTime,
            })
            expect(result).toEqual(expect.objectContaining({
                status: 'success',
                toDelete: 2,
                deleted: 2,
            }))
            const readings = await MeterReading.getAll(admin, {
                id_in: [meterReading.id, meterReading2.id, meterReading3.id, meterReading4.id],
                deletedAt: null,
            })
            expect(readings).toHaveLength(2)
            expect(readings).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: meterReading.id }),
                expect.objectContaining({ id: meterReading4.id }),
            ]))
        })

        test('Should only delete imported readings', async () => {
            const [source2] = await createTestMeterReadingSource(admin, {
                type: METER_READING_SOURCE_MOBILE_RESIDENT_APP_TYPE,
                name: faker.name.suffix(),
            })
            const [source3] = await createTestMeterReadingSource(admin, {
                type: METER_READING_SOURCE_CRM_TYPE,
                name: faker.name.suffix(),
            })
            const [meterReading2] = await createTestMeterReading(admin, meter, source2, { value1: meterReading.value1 })
            const [meterReading3] = await createTestMeterReading(admin, meter, source3, { value1: meterReading2.value1 })

            const [result] = await _internalDeleteMeterReadingsByTestClient(support, {
                ...payload,
                endDateTime: dayjs().format(DATE_FORMAT),
            })
            expect(result).toEqual(expect.objectContaining({
                status: 'success',
                toDelete: 1,
                deleted: 1,
            }))
            const readings = await MeterReading.getAll(admin, {
                id_in: [meterReading.id, meterReading2.id, meterReading3.id],
                deletedAt: null,
            })
            expect(readings).toHaveLength(2)
            expect(readings).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: meterReading2.id }),
                expect.objectContaining({ id: meterReading3.id }),
            ]))
        })

        test('Should delete a lot of readings', async () => {
            const createdReadingIds = [meterReading.id]

            for (let i = 0; i < 150; i++) {
                const [newMeterReading] = await createTestMeterReading(admin, meter, condoImportSource, { value1: meterReading.value1 })
                createdReadingIds.push(newMeterReading.id)
            }

            const [result] = await _internalDeleteMeterReadingsByTestClient(support, {
                ...payload,
                endDateTime: dayjs().format(DATE_FORMAT),
            })
            expect(result).toEqual(expect.objectContaining({
                status: 'success',
                toDelete: createdReadingIds.length,
                deleted: createdReadingIds.length,
            }))
            const readings = await MeterReading.getAll(admin, {
                id_in: createdReadingIds,
                deletedAt: null,
            })
            expect(readings).toHaveLength(0)
        })
    })
})
