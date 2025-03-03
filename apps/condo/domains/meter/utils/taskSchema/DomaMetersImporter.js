const { get, isEqual, isNil, has } = require('lodash')

const { AbstractMetersImporter } = require('./AbstractMetersImporter')
const { TransformRowError } = require('./MetersDataImporterTypes')

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

        if (errors.length > 0) {
            throw new TransformRowError(errors)
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
            date: row[11],
            value1: isNil(row[7]) ? undefined : row[7],
            value2: isNil(row[8]) ? undefined : row[8],
            value3: isNil(row[9]) ? undefined : row[9],
            value4: isNil(row[10]) ? undefined : row[10],
            meterMeta: {
                numberOfTariffs: Number(row[6]),
                place: row[18],
                verificationDate: row[12],
                nextVerificationDate: row[13],
                installationDate: row[14],
                commissioningDate: row[15],
                sealingDate: row[16],
                controlReadingsDate: row[17],
                isAutomatic: get(this, ['mappers', 'isAutomatic', cell19Value]),
            },
        }
    }
}

module.exports = {
    DomaMetersImporter,
}
