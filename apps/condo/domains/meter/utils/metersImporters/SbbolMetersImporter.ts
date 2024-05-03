import { RegisterMetersReadingsReadingInput } from '@app/condo/schema'

import {
    COLD_WATER_METER_RESOURCE_ID,
    ELECTRICITY_METER_RESOURCE_ID,
    GAS_SUPPLY_METER_RESOURCE_ID,
    HEAT_SUPPLY_METER_RESOURCE_ID,
    HOT_WATER_METER_RESOURCE_ID,
} from '@condo/domains/meter/constants/constants'

import { AbstractMetersImporter } from './AbstractMetersImporter'

const METERS_BLOCK_LENGTH = 7

export default class SbbolMetersImporter extends AbstractMetersImporter {

    protected transformRow (row: string[]): RegisterMetersReadingsReadingInput[] {
        const [accountNumber, clientName, accountGlobalId, addressGlobalId, address, ...metersBlocks] = row
        const result = {}
        let nextBlock = metersBlocks.splice(0, METERS_BLOCK_LENGTH)
        while (nextBlock.length === METERS_BLOCK_LENGTH) {
            const [meterType, meterNumber, meterName, nextVerificationDate, meterValue, date, additionalInfo] = nextBlock

            if (meterType && meterNumber && meterValue && date) {
                let values, meterResourceId, numberOfTariffs = 1

                switch (meterType) {
                    case '1': // Gas
                        meterResourceId = GAS_SUPPLY_METER_RESOURCE_ID
                        values = { value1: meterValue }
                        break
                    case '2': // Electricity
                        meterResourceId = ELECTRICITY_METER_RESOURCE_ID
                        values = { value1: meterValue }
                        break
                    case '3': // Electricity (day) (for 2-tariff meter)
                        meterResourceId = ELECTRICITY_METER_RESOURCE_ID
                        values = { value1: meterValue }
                        numberOfTariffs = 2
                        break
                    case '4': // Electricity (night) (for 2-tariff meter)
                        meterResourceId = ELECTRICITY_METER_RESOURCE_ID
                        values = { value2: meterValue }
                        numberOfTariffs = 2
                        break
                    case '5': // Electricity (peak) (for 3-tariff meter)
                        meterResourceId = ELECTRICITY_METER_RESOURCE_ID
                        values = { value3: meterValue }
                        numberOfTariffs = 3
                        break
                    case '6': // Electricity (day) (for 3-tariff meter)
                        meterResourceId = ELECTRICITY_METER_RESOURCE_ID
                        values = { value1: meterValue }
                        numberOfTariffs = 3
                        break
                    case '7': // Electricity (night) (for 3-tariff meter)
                        meterResourceId = ELECTRICITY_METER_RESOURCE_ID
                        values = { value2: meterValue }
                        numberOfTariffs = 3
                        break
                    case '8': // Hot water
                        meterResourceId = HOT_WATER_METER_RESOURCE_ID
                        values = { value1: meterValue }
                        break
                    case '9': // Cold water
                        meterResourceId = COLD_WATER_METER_RESOURCE_ID
                        values = { value1: meterValue }
                        break
                    case '10': // Heating
                        meterResourceId = HEAT_SUPPLY_METER_RESOURCE_ID
                        values = { value1: meterValue }
                        break
                    case '11': // Water disposal
                    case '12': // Water for irrigation
                    case '13': // Garbage
                    default:
                        // Return empty data if meter type was not detected
                        return []
                }

                if (result[meterNumber]) {
                    result[meterNumber] = {
                        ...result[meterNumber],
                        ...values,
                    }
                } else {
                    result[meterNumber] = {
                        address,
                        addressInfo: {
                            // This registry type does not contain separated fields for unitType and unitName
                            globalId: addressGlobalId,
                        },
                        accountNumber,
                        meterNumber,
                        meterResource: { id: meterResourceId },
                        date,
                        ...values,
                        meterMeta: {
                            numberOfTariffs,
                            place: null,
                            verificationDate: null,
                            nextVerificationDate,
                            installationDate: null,
                            commissioningDate: null,
                            sealingDate: null,
                            controlReadingsDate: null,
                        },
                    }
                }
            }

            nextBlock = metersBlocks.splice(0, METERS_BLOCK_LENGTH)
        }

        return Object.values(result)
    }
}
