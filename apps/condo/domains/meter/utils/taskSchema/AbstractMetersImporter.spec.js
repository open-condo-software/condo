const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')
const cloneDeep = require('lodash/cloneDeep')

const { DEFAULT_DATE_PARSING_FORMATS } = require('@condo/domains/common/constants/import')
const { tryToISO } = require('@condo/domains/common/utils/import/date')
const { DATE_FIELD_PATH_TO_TRANSLATION } = require('@condo/domains/meter/constants/registerMetersReadingsService')

const { AbstractMetersImporter } = require('./AbstractMetersImporter')

class ImporterWrapper extends AbstractMetersImporter {
    errors = {
        tooManyRows: { message: 'tooManyRows' },
        invalidColumns: { message: 'invalidColumns' },
        invalidTypes: { message: 'invalidTypes' },
        normalization: { message: 'normalization' },
        validation: { message: 'validation' },
        creation: { message: 'creation' },
        emptyRows: { message: 'emptyRows' },
        unknownResource: { message: 'unknownResource' },
        unknownUnitType: { message: 'unknownUnitType' },
        unknownIsAutomatic: { message: 'unknownIsAutomatic' },
        invalidDate: { get: (columnName) => `invalidDate on ${columnName}` },
    }

    constructor () {
        super(null, null, null, null, {}, null)
        this.dateColumnsTranslationsByPath = {
            ...DATE_FIELD_PATH_TO_TRANSLATION,
        }
    }

    transformRow (row) {
        return super.transformRow
    }
}


function generateValidDatesByFormats (formats) {
    return formats.map(format => dayjs(faker.date.past()).format(format))
}

const defaultReading = {
    address: '',
    addressInfo: {
        unitType: 'flat',
        unitName: '1',
    },
    accountNumber: '001',
    meterNumber: '0001',
    meterResource: {
        id: '0f54223c-0631-11ec-9a03-0242ac130003',
    },
    date: '',
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
        isAutomatic: true,
    },
}

describe('AbstractMetersImporter', () => {
    let abstractMetersImporter

    beforeEach(() => {
        abstractMetersImporter = new ImporterWrapper()
    })

    describe('Row preparing', () => {
        it('Converts valid dates in utc', () => {
            const dates = generateValidDatesByFormats(DEFAULT_DATE_PARSING_FORMATS)
            const readings = dates.map(date => {
                const reading = cloneDeep(defaultReading)
                reading.date = date
                reading.meterMeta.controlReadingsDate = date
                reading.meterMeta.commissioningDate = date
                reading.meterMeta.installationDate = date
                reading.meterMeta.nextVerificationDate = date
                reading.meterMeta.verificationDate = date
                reading.meterMeta.sealingDate = date
                return reading
            })

            for (let i = 0; i < readings.length; i += 1) {
                const reading = readings[i]
                const rawDate = dates[i]
                const utcDate = tryToISO(rawDate)
                abstractMetersImporter.prepareReading(reading)

                expect(reading.date).toEqual(utcDate)
                expect(reading.meterMeta.controlReadingsDate).toEqual(utcDate)
                expect(reading.meterMeta.commissioningDate).toEqual(utcDate)
                expect(reading.meterMeta.installationDate).toEqual(utcDate)
                expect(reading.meterMeta.nextVerificationDate).toEqual(utcDate)
                expect(reading.meterMeta.verificationDate).toEqual(utcDate)
                expect(reading.meterMeta.sealingDate).toEqual(utcDate)
            }
        })

        it('Sets reading source', () => {
            const reading = cloneDeep(defaultReading)
            abstractMetersImporter.prepareReading(reading)
            expect(reading.readingSource).toEqual({ id: 'b0caa26a-bfba-41e3-a9fe-64d7f02f0650' })
        })

    })

    describe('Row validation', () => {

        it('Validates invalid dates', () => {
            const dates = [
                '2024-28-05',
                '2024-28',
                '!7260-3!1-2',
            ]

            const readings = dates.map(date => {
                const reading = cloneDeep(defaultReading)
                reading.date = date
                reading.meterMeta.controlReadingsDate = date
                reading.meterMeta.commissioningDate = date
                reading.meterMeta.installationDate = date
                reading.meterMeta.nextVerificationDate = date
                reading.meterMeta.verificationDate = date
                reading.meterMeta.sealingDate = date
                return reading
            })

            for (let i = 0; i < readings.length; i += 1) {
                const errors = abstractMetersImporter.validateReading(readings[i])
                expect(errors).toHaveLength(1)
                expect(errors).toEqual([
                    'invalidDate on meter.import.column.meterReadingSubmissionDate", "meter.import.column.VerificationDate",' +
                    ' "meter.import.column.NextVerificationDate", "meter.import.column.NextVerificationDate",' +
                    ' "meter.import.column.CommissioningDate", "meter.import.column.SealingDate", "meter.import.column.ControlReadingsDate',
                ])
            }

        })

    })
})