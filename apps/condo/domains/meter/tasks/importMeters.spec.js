/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const {
    setFakeClientMode, makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    CSV,
    CANCELLED,
    COMPLETED,
    ERROR,
} = require('@condo/domains/common/constants/import')
const { importMeters, createUpload } = require('@condo/domains/meter/tasks/importMeters')
const { MeterReadingsImportTask, MeterReading } = require('@condo/domains/meter/utils/serverSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestPropertyWithMap } = require('@condo/domains/property/utils/testSchema')

const { keystone } = index
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: faker.datatype.uuid() } }

const generateCsvFile = (validLinesSize, invalidLinesSize, fatalErrorLinesSize, property) => {
    // content header
    let content = `#DATE_BEGIN01.12.2023
#DATE_END: 31.12.2023`
    
    // generate valid lines lines
    for (let i = 0 ; i < validLinesSize; i++) {
        const number = faker.datatype.number({ min:1000, max: 9999 })
        const lastName = faker.name.lastName()
        const unitName = `${i + 1}`
        const address = property.address + ', кв ' + unitName
        content += `
00-00000${number};${lastName} Л.М.;40ОН89${number}-02;${faker.datatype.uuid()},;${address},;9;${number}${number};ХВС;[];750,00;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;
`
    }

    // generate invalid lines lines
    for (let i = 0 ; i < invalidLinesSize; i++) {
        const number = faker.datatype.number({ min:1000, max: 9999 })
        const lastName = faker.name.lastName()
        const unitName = `${validLinesSize + i + 1}`
        const address = property.address + ', кв ' + unitName
        content += `
;${lastName} Л.М.;40ОН89${number}-02;${faker.datatype.uuid()},;${address},;9;${number}${number};ХВС;[];750,00;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;
`
    }

    // generate fatal error lines lines
    for (let i = 0 ; i < fatalErrorLinesSize; i++) {
        const number = faker.datatype.number({ min:1000, max: 9999 })
        const lastName = faker.name.lastName()
        const address = faker.address.streetAddress(true)
        content += `
;${lastName} Л.М.;40ОН89${number}-02;${faker.datatype.uuid()},;${address},;9;${number}${number};ХВС;[];750,00;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;
`
    }

    return createUpload(content, `${faker.datatype.uuid()}.csv`, 'text/csv')
}

describe('importMeters', () => {
    let context
    setFakeClientMode(index)

    beforeAll(async () => {
        context = await keystone.createContext({ skipAccessControl: true })
    })

    it('import meters csv all lines success case', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestPropertyWithMap(adminClient, o10n)

        const validLines = 5
        const invalidLines = 0
        const fatalLines = 0
        const meterReadingsImportTask = await MeterReadingsImportTask.create(context, {
            ...dvAndSender,
            file: generateCsvFile(validLines, invalidLines, fatalLines, property),
            user: { connect: { id: adminClient.user.id } },
            organization: { connect: { id: o10n.id } },
        })

        // run import
        await importMeters(meterReadingsImportTask.id)

        // assert
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id })
        expect(task).toMatchObject({
            format: CSV,
            file: expect.objectContaining({ mimetype: 'text/csv' }),
            errorMessage: null,
            totalRecordsCount: validLines + invalidLines + fatalLines,
            importedRecordsCount: validLines,
            processedRecordsCount: validLines + invalidLines,
        })
        const readings = await MeterReading.getAll(keystone, {
            organization: { id: o10n.id },
        })
        expect(readings).toHaveLength(validLines)
    })

    it('import meters csv has failed lines case', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestPropertyWithMap(adminClient, o10n)

        const validLines = 5
        const invalidLines = 5
        const fatalLines = 0
        const meterReadingsImportTask = await MeterReadingsImportTask.create(context, {
            ...dvAndSender,
            file: generateCsvFile(validLines, invalidLines, fatalLines, property),
            user: { connect: { id: adminClient.user.id } },
            organization: { connect: { id: o10n.id } },
        })

        // run import
        await importMeters(meterReadingsImportTask.id)

        // assert
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id })
        expect(task).toMatchObject({
            status: ERROR,
            format: CSV,
            file: expect.objectContaining({ mimetype: 'text/csv' }),
            errorFile: expect.objectContaining({ originalFilename: 'meters_failed_data.csv', mimetype: 'text/csv' }),
            errorMessage: null,
            totalRecordsCount: validLines + invalidLines + fatalLines,
            importedRecordsCount: validLines,
            processedRecordsCount: validLines + invalidLines,
        })
        const readings = await MeterReading.getAll(keystone, {
            organization: { id: o10n.id },
        })
        expect(readings).toHaveLength(validLines)
    })

    it('import meters csv has fatal lines case', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestPropertyWithMap(adminClient, o10n)

        const validLines = 5
        const invalidLines = 5
        const fatalLines = 1
        const meterReadingsImportTask = await MeterReadingsImportTask.create(context, {
            ...dvAndSender,
            file: generateCsvFile(validLines, invalidLines, fatalLines, property),
            user: { connect: { id: adminClient.user.id } },
            organization: { connect: { id: o10n.id } },
        })

        // run import
        await importMeters(meterReadingsImportTask.id)

        // assert
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id })
        expect(task).toMatchObject({
            status: ERROR,
            format: CSV,
            file: expect.objectContaining({ mimetype: 'text/csv' }),
            errorFile: null,
            errorMessage: 'The `s` parameter is mandatory',
            totalRecordsCount: validLines + invalidLines + fatalLines,
            importedRecordsCount: 0,
            processedRecordsCount: 0,
        })
    })

    it('import meters csv has been canceled case', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestPropertyWithMap(adminClient, o10n)

        const validLines = 5
        const invalidLines = 5
        const fatalLines = 0
        const meterReadingsImportTask = await MeterReadingsImportTask.create(context, {
            ...dvAndSender,
            status: CANCELLED,
            file: generateCsvFile(validLines, invalidLines, fatalLines, property),
            user: { connect: { id: adminClient.user.id } },
            organization: { connect: { id: o10n.id } },
        })

        // run import
        await importMeters(meterReadingsImportTask.id)

        // assert
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id })
        expect(task).toMatchObject({
            status: CANCELLED,
            format: CSV,
            file: expect.objectContaining({ mimetype: 'text/csv' }),
            errorFile: null,
            errorMessage: null,
            totalRecordsCount: validLines + invalidLines + fatalLines,
            importedRecordsCount: 0,
            processedRecordsCount: 0,
        })
    })
})