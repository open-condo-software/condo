const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const { get, isEqual, isNil, has } = require('lodash')

const { ExcelParser } = require('@open-condo/keystone/file/file-types/excel')

const { AbstractMetersImporter } = require('./AbstractMetersImporter')
const { TransformRowError } = require('./MetersDataImporterTypes')

dayjs.extend(utc)

const DATE_COLUMN_INDEXES = [
    11,
    12,
    13,
    14,
    15,
    16,
    17,
]

class DomaMetersImporter extends AbstractMetersImporter {
    hasColumnsHeaders () {
        return true
    }

    areColumnsHeadersValid (headersRow) {
        const normalizedColumns = headersRow.map(value => {
            if (typeof value === 'string') {
                return value.trim().toLowerCase()
            }
            return value
        })
        const columnsNames = this.columnsHeaders.map(column =>
            column.name.trim().toLowerCase()
        )
        return isEqual(columnsNames, normalizedColumns)
    }

    /**
     * @inheritDoc
     * @return {RegisterMetersReadingsReadingInput}
     */
    transformRow (row) {
        /** @type {string[]} */
        const errors = []
        if (!get(this, ['mappers', 'resourceId', row[4]])) {
            errors.push(this.errors.unknownResource.message)
        }

        if (!get(this, ['mappers', 'unitType', String(row[2]).toLowerCase()])) {
            errors.push(this.errors.unknownUnitType.message)
        }

        const cell19Value = String(row[19]).toLowerCase()
        if (!!row[19] && !has(this, ['mappers', 'isAutomatic', cell19Value])) {
            errors.push(this.errors.unknownIsAutomatic.message)
        }

        // do not put utc date in row, this will be printed in pdf if errors
        const excelParsedDates = {}
        // date can be os type text or excel date type, which parses number
        DATE_COLUMN_INDEXES
            .filter(index => ExcelParser.isExcelDate(row[index]))
            .forEach(index => {
                excelParsedDates[index] = ExcelParser.parseExcelDate(+row[index])
                row[index] = dayjs.utc(excelParsedDates[index]).format('YYYY-MM-DD HH:mm:ss')
            })

        if (errors.length > 0) {
            throw new TransformRowError(errors)
        }

        const getDateString = (row, index) => {
            return excelParsedDates[index] || row[index]
        }

        return {
            address: row[0],
            addressInfo: {
                unitType: this.mappers.unitType[String(row[2]).toLowerCase()],
                unitName: row[1],
            },
            accountNumber: row[3],
            meterNumber: row[5],
            meterResource: { id: this.mappers.resourceId[row[4]] },
            date: getDateString(row, 11),
            value1: isNil(row[7]) ? undefined : row[7],
            value2: isNil(row[8]) ? undefined : row[8],
            value3: isNil(row[9]) ? undefined : row[9],
            value4: isNil(row[10]) ? undefined : row[10],
            meterMeta: {
                numberOfTariffs: Number(row[6]),
                place: row[18],
                verificationDate: getDateString(row, 12),
                nextVerificationDate: getDateString(row, 13),
                installationDate: getDateString(row, 14),
                commissioningDate: getDateString(row, 15),
                sealingDate: getDateString(row, 16),
                controlReadingsDate: getDateString(row, 17),
                isAutomatic: get(this, ['mappers', 'isAutomatic', cell19Value]),
            },
        }
    }
}

module.exports = {
    DomaMetersImporter,
}
