const get = require('lodash/get')
const has = require('lodash/has')
const isEqual = require('lodash/isEqual')
const isNil = require('lodash/isNil')

const { AbstractMetersImporter } = require('@condo/domains/meter/utils/taskSchema/AbstractMetersImporter')
const { TransformRowError } = require('@condo/domains/meter/utils/taskSchema/MetersDataImporterTypes')


class DomaPropertyMetersImporter extends AbstractMetersImporter {
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
        const columnsNames = this.columnsHeaders.map(column => {
            return column.name.trim().toLowerCase()
        }
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
        if (!get(this, ['mappers', 'resourceId', row[1]])) {
            errors.push(this.errors.unknownResource.message)
        }

        const cell15Value = String(row[15]).toLowerCase()
        if (!!row[15] && !has(this, ['mappers', 'isAutomatic', cell15Value])) {
            errors.push(this.errors.unknownIsAutomatic.message)
        }

        if (errors.length > 0) {
            throw new TransformRowError(errors)
        }

        return {
            address: row[0],
            meterNumber: row[2],
            meterResource: { id: this.mappers.resourceId[row[1]] },
            date: row[8],
            value1: isNil(row[7]) ? undefined : row[4],
            value2: isNil(row[8]) ? undefined : row[5],
            value3: isNil(row[9]) ? undefined : row[6],
            value4: isNil(row[10]) ? undefined : row[7],
            meterMeta: {
                numberOfTariffs: Number(row[3]),
                verificationDate: row[9],
                nextVerificationDate: row[10],
                installationDate: row[11],
                commissioningDate: row[12],
                sealingDate: row[13],
                controlReadingsDate: row[14],
                isAutomatic: get(this, ['mappers', 'isAutomatic', cell15Value]),
            },
        }
    }
}

module.exports = {
    DomaPropertyMetersImporter,
}
