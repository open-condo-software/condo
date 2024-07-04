const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { SbbolMetersImporter } = require('./SbbolMetersImporter')

class ImporterWrapper extends SbbolMetersImporter {
    constructor () {
        super(null, null, null, null, {})
    }

    transformRowWrapper (row) {
        return this.transformRow(row)
    }
}

describe('SbbolMetersImporter', () => {
    test('Rows transformation must work', () => {
        const fakeAddress = faker.address.streetAddress()
        const date = dayjs().format('DD.MM.YYYY')
        const rows = [
            // Gas
            [
                // First 5 cells is account data
                '0001',
                'resident1',
                'account1',
                'fias1',
                fakeAddress,
                // Each of next 12 blocks is containing 7 cells
                '1',
                '001',
                'MeterName1',
                '[]',
                '101.1',
                date,
                '',
            ],

            // 1-tariff electricity
            [
                '0002',
                'resident2',
                'account2',
                'fias1',
                fakeAddress,
                '2',
                '002',
                'MeterName2',
                '[]',
                '102,1',
                date,
                '',
            ],

            // 2-tariff electricity
            [
                '0003',
                'resident3',
                'account3',
                'fias1',
                fakeAddress,
                '3',
                '003',
                'MeterName3',
                '[]',
                '103.1',
                date,
                '',
            ],
            [
                '0004',
                'resident4',
                'account4',
                'fias1',
                fakeAddress,
                '4',
                '004',
                'MeterName4',
                '[]',
                '104.1',
                date,
                '',
            ],
            [
                '0034',
                'resident34',
                'account34',
                'fias1',
                fakeAddress,
                '3',
                '034',
                'MeterName34',
                '',
                '103.1',
                date,
                '',
                '4',
                '034',
                'MeterName34',
                '',
                '104.1',
                date,
                '',
            ],

            // 3-tariff electricity
            [
                '0005',
                'resident5',
                'account5',
                'fias1',
                fakeAddress,
                '5',
                '005',
                'MeterName5',
                '[]',
                '105.1',
                date,
                '',
            ],
            [
                '0006',
                'resident6',
                'account6',
                'fias1',
                fakeAddress,
                '6',
                '006',
                'MeterName6',
                '[]',
                '106.1',
                date,
                '',
            ],
            [
                '0007',
                'resident7',
                'account7',
                'fias1',
                fakeAddress,
                '7',
                '007',
                'MeterName7',
                '[]',
                '107.1',
                date,
                '',
            ],
            [
                '0057',
                'resident57',
                'account57',
                'fias1',
                fakeAddress,
                '5',
                '057',
                'MeterName57',
                '[]',
                '105,1',
                date,
                '',
                '7',
                '057',
                'MeterName57',
                '[]',
                '107,1',
                date,
                '',
            ],

            // Hot water
            [
                '0008',
                'resident8',
                'account8',
                'fias1',
                fakeAddress,
                '8',
                '008',
                'MeterName8',
                '[]',
                '108.1',
                date,
                '',
            ],

            // Cold water
            [
                '0009',
                'resident9',
                'account9',
                'fias1',
                fakeAddress,
                '9',
                '009',
                'MeterName9',
                '[]',
                '109.1',
                date,
                '',
            ],

            //
            // Different cases
            //

            // three readings for two meters per single line
            [
                '0010-11',
                'resident1',
                'account1',
                'fias1',
                fakeAddress,
                '9',
                '010',
                'MeterName10',
                '',
                '110.1',
                date,
                '',
                '3',
                '011',
                'MeterName11',
                '',
                '111,1',
                date,
                '',
                '4',
                '011',
                'MeterName11',
                '',
                '111.2',
                date,
                '',
            ],
        ]

        const importer = new ImporterWrapper()
        const result = []
        for (const row of rows) {
            const transformedRow = importer.transformRowWrapper(row)
            for (const rowPart of transformedRow) {
                result.push(rowPart)
            }
        }

        expect(result).toEqual([
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0001',
                meterNumber: '001',
                meterResource: {
                    id: '1c267e92-0631-11ec-9a03-0242ac130003',
                },
                date,
                value1: '101.1',
                meterMeta: {
                    numberOfTariffs: 1,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0002',
                meterNumber: '002',
                meterResource: {
                    id: '139a0d98-0631-11ec-9a03-0242ac130003',
                },
                date,
                value1: '102,1',
                meterMeta: {
                    numberOfTariffs: 1,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0003',
                meterNumber: '003',
                meterResource: {
                    id: '139a0d98-0631-11ec-9a03-0242ac130003',
                },
                date,
                value1: '103.1',
                meterMeta: {
                    numberOfTariffs: 2,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0004',
                meterNumber: '004',
                meterResource: {
                    id: '139a0d98-0631-11ec-9a03-0242ac130003',
                },
                date,
                value2: '104.1',
                meterMeta: {
                    numberOfTariffs: 2,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0034',
                meterNumber: '034',
                meterResource: {
                    id: '139a0d98-0631-11ec-9a03-0242ac130003',
                },
                date,
                value1: '103.1',
                meterMeta: {
                    numberOfTariffs: 2,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
                value2: '104.1',
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0005',
                meterNumber: '005',
                meterResource: {
                    id: '139a0d98-0631-11ec-9a03-0242ac130003',
                },
                date,
                value3: '105.1',
                meterMeta: {
                    numberOfTariffs: 3,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0006',
                meterNumber: '006',
                meterResource: {
                    id: '139a0d98-0631-11ec-9a03-0242ac130003',
                },
                date,
                value1: '106.1',
                meterMeta: {
                    numberOfTariffs: 3,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0007',
                meterNumber: '007',
                meterResource: {
                    id: '139a0d98-0631-11ec-9a03-0242ac130003',
                },
                date,
                value2: '107.1',
                meterMeta: {
                    numberOfTariffs: 3,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0057',
                meterNumber: '057',
                meterResource: {
                    id: '139a0d98-0631-11ec-9a03-0242ac130003',
                },
                date,
                value3: '105,1',
                meterMeta: {
                    numberOfTariffs: 3,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
                value2: '107,1',
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0008',
                meterNumber: '008',
                meterResource: {
                    id: '0f54223c-0631-11ec-9a03-0242ac130003',
                },
                date,
                value1: '108.1',
                meterMeta: {
                    numberOfTariffs: 1,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0009',
                meterNumber: '009',
                meterResource: {
                    id: 'e2bd70ac-0630-11ec-9a03-0242ac130003',
                },
                date,
                value1: '109.1',
                meterMeta: {
                    numberOfTariffs: 1,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '[]',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0010-11',
                meterNumber: '010',
                meterResource: {
                    id: 'e2bd70ac-0630-11ec-9a03-0242ac130003',
                },
                date,
                value1: '110.1',
                meterMeta: {
                    numberOfTariffs: 1,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    globalId: 'fias1',
                },
                accountNumber: '0010-11',
                meterNumber: '011',
                meterResource: {
                    id: '139a0d98-0631-11ec-9a03-0242ac130003',
                },
                date,
                value1: '111,1',
                meterMeta: {
                    numberOfTariffs: 2,
                    place: null,
                    verificationDate: null,
                    nextVerificationDate: '',
                    installationDate: null,
                    commissioningDate: null,
                    sealingDate: null,
                    controlReadingsDate: null,
                },
                value2: '111.2',
            },
        ])
    })
})
