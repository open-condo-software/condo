/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const {
    setFakeClientMode, makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    IMPORT_FORMAT_VALUES,
    IMPORT_STATUS_VALUES,
    EXCEL,
    CSV,
    PROCESSING,
    CANCELLED,
    COMPLETED,
    ERROR,
    METER_IMPORT_TASK_FOLDER_NAME,
} = require('@condo/domains/common/constants/import')
const { importMeters, createUpload } = require('@condo/domains/meter/tasks/importMeters')
const { MeterImportTask } = require('@condo/domains/meter/utils/serverSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestPropertyWithMap } = require('@condo/domains/property/utils/testSchema')

const { keystone } = index
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: faker.datatype.uuid() } }

const generateCsvFile = (size, property) => {
    // content header
    let content = `#DATE_BEGIN01.12.2023
#DATE_END: 31.12.2023`
    
    // content lines
    for (let i = 0 ; i < size; i++) {
        const number = faker.datatype.number({ min:1000, max: 9999 })
        const lastName = faker.name.lastName()
        const unitName = `${i + 1}`
        const address = property.address + ', кв ' + unitName
        content += `
00-00000${number};${lastName} Л.М.;40ОН89${number}-02;${faker.datatype.uuid()},;${address},;9;${number}${number};ХВС;[];750,00;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;;;;;;;31.12.2023;
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

    it('import meters csv success case', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestPropertyWithMap(adminClient, o10n)
        // const readings = [createTestReadingData(property)]
        // const [data] = await registerMetersReadingsByTestClient(adminClient, o10n, readings)
        
        const meterImportTask = await MeterImportTask.create(context, { 
            ...dvAndSender,
            file: generateCsvFile(5, property),
            user: { connect: { id: adminClient.user.id } },
            organization: { connect: { id: o10n.id } },
        })
        
        // run import
        await importMeters(meterImportTask.id)
        
        // assert
        const task = await MeterImportTask.getOne(context, { id: meterImportTask.id })
        expect(task).toMatchObject({
            status: COMPLETED,
            errorFile: null,
            errorMessage: null,
        })
    })
})