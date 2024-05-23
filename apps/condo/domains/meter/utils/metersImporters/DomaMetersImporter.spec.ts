import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'

import DomaMetersImporter from './DomaMetersImporter'

class ImporterWrapper extends DomaMetersImporter {

    mappers = {
        unitType: {
            'квартира': 'flat',
            'машиноместо': 'parking',
            'апартаменты': 'apartment',
            'кладовая': 'warehouse',
            'коммерческое помещение': 'commercial',
        },
        resourceId: {
            'ГВС': '0f54223c-0631-11ec-9a03-0242ac130003',
            'ХВС': 'e2bd70ac-0630-11ec-9a03-0242ac130003',
            'ЭЛ': '139a0d98-0631-11ec-9a03-0242ac130003',
            'ТЕПЛО': '18555734-0631-11ec-9a03-0242ac130003',
            'ГАЗ': '1c267e92-0631-11ec-9a03-0242ac130003',
        },
    }

    errors = {
        invalidColumns: { message: 'invalidColumns' },
        tooManyRows: { message: 'tooManyRows' },
        invalidTypes: { message: 'invalidTypes' },
        normalization: { message: 'normalization' },
        validation: { message: 'validation' },
        creation: { message: 'creation' },
        emptyRows: { message: 'emptyRows' },
        unknownResource: { message: 'unknownResource' },
        unknownUnitType: { message: 'unknownUnitType' },
    }

    constructor () {
        super(null, null, null, null, {})
    }

    public transformRowWrapper (row: string[]) {
        return this.transformRow(row)
    }
}

describe('DomaMetersImporter', () => {
    test('Rows transformation must work', () => {
        const fakeAddress = faker.address.streetAddress()
        const date = dayjs().format('DD.MM.YYYY')
        const verificationDate = dayjs().format('DD.MM.YYYY')
        const sealingDate = dayjs().format('DD.MM.YYYY')
        const rows = [
            // address, unitName, unitType, accountNumber, meterType, meterNumber, tariffs, v1, v2, v3, v4, date, verificationDate, nextVerificationDate, installationDate, commissioningDate, sealingDate, controlReadingsDate, place
            [fakeAddress, '1', 'Квартира', '001', 'ГВС', '0001', '1', '101.1', null, '', '', date, '', '', '', '', '', '', ''],
            [fakeAddress, '1', 'Квартира', '001', 'ХВС', '0002', '1', '102.1', '', '', '', date, '', '', '', '', sealingDate, '', ''],
            [fakeAddress, '2', 'Квартира', '003', 'ХВС', '0003', '2', '103.1', '', '', '', date, verificationDate, '', '', '', '', '', ''],
            [fakeAddress, '3', 'Бунгало', '003', 'ХВС', '0004', '1', '104', '', '', '', date, '', '', '', '', '', '', ''],
            [fakeAddress, '2', 'Квартира', '003', 'Костер', '0005', '1', '105', '', '', '', date, '', '', '', '', '', '', ''],
        ]

        const importer = new ImporterWrapper()
        const result = []
        const errors = []
        for (const row of rows) {
            try {
                const transformedRow = importer.transformRowWrapper(row)
                result.push(transformedRow)
            } catch (err) {
                errors.push(err.getMessages())
            }
        }

        expect(result).toEqual([
            {
                address: fakeAddress,
                addressInfo: {
                    unitType: 'flat',
                    unitName: '1',
                },
                accountNumber: '001',
                meterNumber: '0001',
                meterResource: {
                    id: '0f54223c-0631-11ec-9a03-0242ac130003',
                },
                date: date,
                value1: '101.1',
                value2: undefined,
                value3: '',
                value4: '',
                meterMeta: {
                    numberOfTariffs: 1,
                    place: '',
                    verificationDate: '',
                    nextVerificationDate: '',
                    installationDate: '',
                    commissioningDate: '',
                    sealingDate: '',
                    controlReadingsDate: '',
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    unitType: 'flat',
                    unitName: '1',
                },
                accountNumber: '001',
                meterNumber: '0002',
                meterResource: {
                    id: 'e2bd70ac-0630-11ec-9a03-0242ac130003',
                },
                date: date,
                value1: '102.1',
                value2: '',
                value3: '',
                value4: '',
                meterMeta: {
                    numberOfTariffs: 1,
                    place: '',
                    verificationDate: '',
                    nextVerificationDate: '',
                    installationDate: '',
                    commissioningDate: '',
                    sealingDate: sealingDate,
                    controlReadingsDate: '',
                },
            },
            {
                address: fakeAddress,
                addressInfo: {
                    unitType: 'flat',
                    unitName: '2',
                },
                accountNumber: '003',
                meterNumber: '0003',
                meterResource: {
                    id: 'e2bd70ac-0630-11ec-9a03-0242ac130003',
                },
                date: date,
                value1: '103.1',
                value2: '',
                value3: '',
                value4: '',
                meterMeta: {
                    numberOfTariffs: 2,
                    place: '',
                    verificationDate: verificationDate,
                    nextVerificationDate: '',
                    installationDate: '',
                    commissioningDate: '',
                    sealingDate: '',
                    controlReadingsDate: '',
                },
            },
        ])

        expect(errors).toEqual([
            ['unknownUnitType'],
            ['unknownResource'],
        ])
    })
})
