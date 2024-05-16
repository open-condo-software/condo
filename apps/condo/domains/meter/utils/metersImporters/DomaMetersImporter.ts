import { RegisterMetersReadingsReadingInput } from '@app/condo/schema'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'

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
        return {
            address: row[0],
            addressInfo: {
                unitType: this.mappers.unitType[String(row[2]).toLowerCase()],
                unitName: String(row[1]),
            },
            accountNumber: String(row[3]),
            meterNumber: String(row[5]),
            meterResource: { id: this.mappers.resourceId[String(row[4])] },
            date: row[11],
            value1: isNil(row[7]) ? null : String(row[7]),
            value2: isNil(row[8]) ? null : String(row[8]),
            value3: isNil(row[9]) ? null : String(row[9]),
            value4: isNil(row[10]) ? null : String(row[10]),
            meterMeta: {
                numberOfTariffs: Number(row[6]),
                place: String(row[18]),
                verificationDate: String(row[12]),
                nextVerificationDate: String(row[13]),
                installationDate: String(row[14]),
                commissioningDate: String(row[15]),
                sealingDate: String(row[16]),
                controlReadingsDate: String(row[17]),
            },
        }
    }
}
