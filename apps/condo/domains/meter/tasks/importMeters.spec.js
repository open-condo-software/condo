/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const { get } = require('lodash')
const XLSX = require('xlsx')

const conf = require('@open-condo/config')
const {
    setFakeClientMode, makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    CSV,
    DOMA_EXCEL,
    CANCELLED,
    ERROR,
} = require('@condo/domains/common/constants/import')
const { EXCEL_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { readXlsx, getTmpFile, downloadFile } = require('@condo/domains/common/utils/testSchema/file')
const { IMPORT_CONDO_METER_READING_SOURCE_ID, COLD_WATER_METER_RESOURCE_ID } = require('@condo/domains/meter/constants/constants')
const { importMeters, createUpload } = require('@condo/domains/meter/tasks/importMeters')
const { MeterReadingsImportTask, MeterReading } = require('@condo/domains/meter/utils/serverSchema')
const { createTestMeter, MeterResource } = require('@condo/domains/meter/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestPropertyWithMap } = require('@condo/domains/property/utils/testSchema')

// NOTE(pahaz): we call this task directly in this specs
jest.mock('@condo/domains/meter/tasks/index')

const { keystone } = index
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: faker.datatype.uuid() } }

const generateCsvFile = (validLinesSize, invalidLinesSize, fatalErrorLinesSize, property) => {
    // content header
    let content = `#DATE_BEGIN01.12.2023
#DATE_END: 31.12.2023`

    // generate valid lines lines
    for (let i = 0; i < validLinesSize; i++) {
        const number = faker.datatype.number({ min: 1000, max: 9999 })
        const lastName = faker.name.lastName()
        const unitName = `${i + 1}`
        const address = property.address + ', кв ' + unitName
        content += `
00-00000${number};${lastName} Л.М.;40ОН89${number}-02;${faker.datatype.uuid()};${address};9;${number}${number};ХВС;[];750,00;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;
`
    }

    // generate invalid lines lines
    for (let i = 0; i < invalidLinesSize; i++) {
        const number = faker.datatype.number({ min: 1000, max: 9999 })
        const lastName = faker.name.lastName()
        const unitName = `${validLinesSize + i + 1}`
        const address = property.address + ', кв ' + unitName
        content += `
;${lastName} Л.М.;40ОН89${number}-02;${faker.datatype.uuid()};${address};9;${number}${number};ХВС;[];750,00;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;
`
    }

    // generate fatal error lines lines
    for (let i = 0; i < fatalErrorLinesSize; i++) {
        const number = faker.datatype.number({ min: 1000, max: 9999 })
        const lastName = faker.name.lastName()
        const address = faker.address.streetAddress(true)
        content += `
;${lastName} Л.М.;40ОН89${number}-02;${faker.datatype.uuid()};${address};9;${number}${number};ХВС;[];750,00;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;
`
    }

    return createUpload(content, `${faker.datatype.uuid()}.csv`, 'text/csv')
}

const generateExcelFile = async (validLinesSize, invalidLinesSize, fatalLinesSize, property) => {
    const data = [[
        'Адрес', 'Помещение', 'Тип помещения', 'Лицевой счет',
        'Тип счетчика', 'Номер счетчика', 'Количество тарифов',
        'Показание 1', 'Показание 2', 'Показание 3', 'Показание 4',
        'Дата передачи показаний', 'Дата поверки', 'Дата следующей поверки',
        'Дата установки', 'Дата ввода в эксплуатацию', 'Дата опломбирования', 'Дата контрольных показаний', 'Место установки счетчика', 'Автоматический']]

    for (let i = 0; i < validLinesSize; i++) {
        const unitName = `${i + 1}`
        const line = [
            property.address, unitName, 'Квартира', `${faker.datatype.number({ min: 1000, max: 9999 })}`,
            'ГВС', `${faker.datatype.number({ min: 1000, max: 9999 })}`, '1',
            `${faker.datatype.number({ min: 1000, max: 9999 })}`, '', '', '',
            '2021-01-21', '2021-01-21', '2021-01-21',
            '2021-01-22', '2021-01-23', '2021-01-24', '2021-01-25', 'Кухня', '',
        ]

        data.push(line)
    }

    for (let i = 0; i < invalidLinesSize; i++) {
        const unitName = `${i + 1}`
        const line = [
            property.address, unitName, 'Квартира', `${faker.datatype.number({ min: 1000, max: 9999 })}`,
            'WRONG_METER_TYPE', `${faker.datatype.number({ min: 1000, max: 9999 })}`, '1',
            `${faker.datatype.number({ min: 1000, max: 9999 })}`, '', '', '',
            '2021-01-21', '2021-01-21', '2021-01-21',
            '2021-01-22', '2021-01-23', '2021-01-24', '2021-01-25', 'Кухня',
        ]

        data.push(line)
    }

    for (let i = 0; i < fatalLinesSize; i++) {
        data.push(data[0])
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'table')
    const content = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    return createUpload(content, `${faker.datatype.uuid()}.xlsx`, EXCEL_FILE_META.mimetype)
}

function generateRowForDomaExcel (data = {}) {
    return [
        get(data, 'address', faker.address.streetAddress(false)),
        get(data, 'unitName', faker.address.buildingNumber()),
        get(data, 'unitType', 'Квартира'),
        get(data, 'accountNumber', faker.random.alphaNumeric(10)), // account number
        get(data, 'resource', 'ГВС'), //resource
        get(data, 'number', faker.random.alphaNumeric(10)), // meter number
        '1', // tariffs count
        `${faker.datatype.number({ min: 1000, max: 9999 })}`, // value1
        '', // value2
        '', // value3
        '', // value4
        '2021-01-21', // MeterReading.date
        '2021-01-21', // verificationDate
        '2021-01-21', // nextVerificationDate
        '2021-01-22', // installationDate
        '2021-01-23', // commissioningDate
        '2021-01-24', // sealingDate
        '2021-01-25', // controlReadingsDate
        'Кухня', // place
        '', // isAutomatic
    ]
}

const generateDomaExcelFileWithGivenData = async (rows) => {
    const data = [[
        'Адрес', 'Помещение', 'Тип помещения', 'Лицевой счет',
        'Тип счетчика', 'Номер счетчика', 'Количество тарифов',
        'Показание 1', 'Показание 2', 'Показание 3', 'Показание 4',
        'Дата передачи показаний', 'Дата поверки', 'Дата следующей поверки',
        'Дата установки', 'Дата ввода в эксплуатацию', 'Дата опломбирования', 'Дата контрольных показаний', 'Место установки счетчика', 'Автоматический']]

    data.push(...rows)

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'table')
    const content = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    return createUpload(content, `${faker.datatype.uuid()}.xlsx`, EXCEL_FILE_META.mimetype)
}

const METER_READINGS_IMPORT_TASK_FIELDS = 'status format file { mimetype } errorFile { originalFilename mimetype filename publicUrl } errorMessage ' +
    'totalRecordsCount importedRecordsCount processedRecordsCount'

describe('importMeters', () => {
    let context
    setFakeClientMode(index)

    beforeAll(async () => {
        context = await keystone.createContext({ skipAccessControl: true })
    })

    it('import meters csv all lines success case', async () => {
        const locale = 'ru'
        const adminClient = await makeLoggedInAdminClient()
        adminClient.setHeaders({ 'Accept-Language': locale })
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
            locale,
        })

        // run import
        await importMeters(meterReadingsImportTask.id)

        // assert
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id },
            METER_READINGS_IMPORT_TASK_FIELDS
        )
        expect(task).toMatchObject({
            format: CSV,
            file: expect.objectContaining({ mimetype: 'text/csv' }),
            errorFile: null,
            errorMessage: null,
            totalRecordsCount: validLines + invalidLines + fatalLines,
            importedRecordsCount: validLines,
            processedRecordsCount: validLines + invalidLines,
        })
        const readings = await MeterReading.getAll(keystone, {
            organization: { id: o10n.id },
        }, 'source { id }')
        expect(readings).toHaveLength(validLines)
        for (const reading of readings) {
            expect(reading.source.id).toBe(IMPORT_CONDO_METER_READING_SOURCE_ID)
        }
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
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id }, METER_READINGS_IMPORT_TASK_FIELDS)
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
        // TODO(pahaz): you should check that errorFile contains exact errors!
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
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id }, METER_READINGS_IMPORT_TASK_FIELDS)
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
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id }, METER_READINGS_IMPORT_TASK_FIELDS)
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

    it('import meters excel all lines success case', async () => {
        const locale = 'ru'
        const adminClient = await makeLoggedInAdminClient()
        adminClient.setHeaders({ 'Accept-Language': locale })
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestPropertyWithMap(adminClient, o10n)

        const validLines = 5
        const invalidLines = 0
        const fatalLines = 0
        const meterReadingsImportTask = await MeterReadingsImportTask.create(context, {
            ...dvAndSender,
            file: await generateExcelFile(validLines, invalidLines, fatalLines, property),
            user: { connect: { id: adminClient.user.id } },
            organization: { connect: { id: o10n.id } },
            locale,
        })

        // run import
        await importMeters(meterReadingsImportTask.id)

        // assert
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id }, METER_READINGS_IMPORT_TASK_FIELDS)
        expect(task).toMatchObject({
            format: DOMA_EXCEL,
            file: expect.objectContaining({ mimetype: EXCEL_FILE_META.mimetype }),
            errorMessage: null,
            errorFile: null,
            totalRecordsCount: validLines + invalidLines + fatalLines,
            importedRecordsCount: validLines,
            processedRecordsCount: validLines + invalidLines,
        })
        const readings = await MeterReading.getAll(keystone, {
            organization: { id: o10n.id },
        }, 'source { id }')
        expect(readings).toHaveLength(validLines)
        for (const reading of readings) {
            expect(reading.source.id).toBe(IMPORT_CONDO_METER_READING_SOURCE_ID)
        }
    })

    it('import meters excel has failed line case', async () => {
        const locale = 'ru'
        const adminClient = await makeLoggedInAdminClient()
        adminClient.setHeaders({ 'Accept-Language': locale })
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestPropertyWithMap(adminClient, o10n)

        const validLines = 5
        const invalidLines = 1
        const fatalLines = 0
        const meterReadingsImportTask = await MeterReadingsImportTask.create(context, {
            ...dvAndSender,
            file: await generateExcelFile(validLines, invalidLines, fatalLines, property),
            user: { connect: { id: adminClient.user.id } },
            organization: { connect: { id: o10n.id } },
            locale,
        })

        // run import
        await importMeters(meterReadingsImportTask.id)

        // assert
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id }, METER_READINGS_IMPORT_TASK_FIELDS)
        expect(task).toMatchObject({
            status: ERROR,
            format: DOMA_EXCEL,
            file: expect.objectContaining({ mimetype: EXCEL_FILE_META.mimetype }),
            errorFile: expect.objectContaining({
                originalFilename: 'meters_failed_data.xlsx',
                mimetype: EXCEL_FILE_META.mimetype,
            }),
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

    it('import meters excel has fatal line case', async () => {
        const locale = 'ru'
        const adminClient = await makeLoggedInAdminClient()
        adminClient.setHeaders({ 'Accept-Language': locale })
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestPropertyWithMap(adminClient, o10n)

        const validLines = 5
        const invalidLines = 0
        const fatalLines = 1
        const meterReadingsImportTask = await MeterReadingsImportTask.create(context, {
            ...dvAndSender,
            file: await generateExcelFile(validLines, invalidLines, fatalLines, property),
            user: { connect: { id: adminClient.user.id } },
            organization: { connect: { id: o10n.id } },
            locale,
        })

        // run import
        await importMeters(meterReadingsImportTask.id)

        // assert
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id }, METER_READINGS_IMPORT_TASK_FIELDS)
        expect(task).toMatchObject({
            status: ERROR,
            format: DOMA_EXCEL,
            file: expect.objectContaining({ mimetype: EXCEL_FILE_META.mimetype }),
            errorFile: expect.objectContaining({
                originalFilename: 'meters_failed_data.xlsx',
                mimetype: EXCEL_FILE_META.mimetype,
            }),
            errorMessage: null,
            totalRecordsCount: validLines + invalidLines + fatalLines,
            importedRecordsCount: validLines,
            processedRecordsCount: validLines + invalidLines + fatalLines,
        })
        // TODO(pahaz): check this error messages!
        const readings = await MeterReading.getAll(keystone, {
            organization: { id: o10n.id },
        })
        expect(readings).toHaveLength(validLines)
    })

    test('error file contains ru-error about meter number exists on another account number', async () => {
        const locale = 'ru'

        const adminClient = await makeLoggedInAdminClient()

        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestPropertyWithMap(adminClient, o10n)

        const [resource] = await MeterResource.getAll(adminClient, { id: COLD_WATER_METER_RESOURCE_ID })
        const [meter] = await createTestMeter(adminClient, o10n, property, resource)

        const rows = [
            generateRowForDomaExcel({ number: meter.number, address: property.address, resource: 'ХВС' }),
        ]

        const meterReadingsImportTask = await MeterReadingsImportTask.create(context, {
            ...dvAndSender,
            file: await generateDomaExcelFileWithGivenData(rows),
            user: { connect: { id: adminClient.user.id } },
            organization: { connect: { id: o10n.id } },
            locale,
        })

        // run import
        await importMeters(meterReadingsImportTask.id)

        // assert
        const task = await MeterReadingsImportTask.getOne(context, { id: meterReadingsImportTask.id }, METER_READINGS_IMPORT_TASK_FIELDS)
        expect(task).toMatchObject({
            format: DOMA_EXCEL,
            file: expect.objectContaining({ mimetype: EXCEL_FILE_META.mimetype }),
            errorMessage: null,
            errorFile: expect.objectContaining({ mimetype: EXCEL_FILE_META.mimetype }),
            status: 'error',
            totalRecordsCount: 1,
            importedRecordsCount: 0,
            processedRecordsCount: 1,
        })
        const readings = await MeterReading.getAll(keystone, {
            organization: { id: o10n.id },
        })
        expect(readings).toHaveLength(0)

        const url = task.errorFile.publicUrl.replace(conf.SERVER_URL, adminClient.serverUrl)
        const filename = getTmpFile('xlsx')
        await downloadFile(url, filename)
        const errorData = await readXlsx(filename)
        expect(errorData[1][20]).toBe(`ИПУ с таким номером и ресурсом уже есть в организации на лицевом счете ${meter.accountNumber}. Проверьте, пожалуйста, правильность данных.`)
    })
})
