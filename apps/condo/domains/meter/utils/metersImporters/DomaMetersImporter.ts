import { RegisterMetersReadingsReadingInput } from '@app/condo/schema'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'

import { TransformRowError } from '@condo/domains/meter/components/MetersDataImporterTypes'

import { AbstractMetersImporter } from './AbstractMetersImporter'

export default class DomaMetersImporter extends AbstractMetersImporter {

    protected hasColumnsHeaders (): boolean {
        return true
    }

    protected areColumnsHeadersValid (headersRow: string[]): boolean {
        const normalizedColumns = headersRow.map((value) => {
            if (typeof value === 'string') {
                return value.trim().toLowerCase()
            }
            return value
        })
        const columnsNames = this.columnsHeaders.map(column => column.name.trim().toLowerCase())
        return isEqual(columnsNames, normalizedColumns)
    }

    protected transformRow (row: string[]): RegisterMetersReadingsReadingInput {
        const errors = []
        if (!get(this, ['mappers', 'resourceId', row[4]])) {
            errors.push(this.errors.unknownResource.message)
        }

        if (!get(this, ['mappers', 'unitType', row[2].toLowerCase()])) {
            errors.push(this.errors.unknownUnitType.message)
        }

        if (errors.length > 0) {
            throw new TransformRowError(errors)
        }

        return {
            address: row[0],
            addressInfo: {
                unitType: this.mappers.unitType[row[2].toLowerCase()],
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
            },
        }
    }
}
