import get from 'lodash/get'
import map from 'lodash/map'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import {
    COLD_WATER_METER_RESOURCE_ID,
    ELECTRICITY_METER_RESOURCE_ID,
    GAS_SUPPLY_METER_RESOURCE_ID,
    HEAT_SUPPLY_METER_RESOURCE_ID,
    HOT_WATER_METER_RESOURCE_ID,
} from '@condo/domains/meter/constants/constants'
import {
    APARTMENT_UNIT_TYPE, COMMERCIAL_UNIT_TYPE,
    FLAT_UNIT_TYPE,
    PARKING_UNIT_TYPE,
    WAREHOUSE_UNIT_TYPE,
} from '@condo/domains/property/constants/common'



type MeterReading = {
    date: Date
    v1: number | string | null
    v2: number | string | null
    v3: number | string | null
    v4: number | string | null
}
type Meter = {
    nextVerificationDate: Date
    number: string | number
    resourceTypeId: string
    readings: Array<MeterReading>
    numberOfTariffs?: string | number
}
type ProcessedMeterReading = {
    account: string | number
    accountMeta?: {
        clientName: string
    }
    address: string
    addressMeta?: {
        unitName: string
        unitType: string
    }
    meters: Array<Meter>
}

type ReadingsData = Array<Array<Record<'value', string | number>>>
type MeterReadingsProcessor = (data: ReadingsData) => ProcessedReadings
export type ProcessedReadings = Array<ProcessedMeterReading>

export const useProcessMeterReadings = (): [MeterReadingsProcessor] => {
    const intl = useIntl()
    const HotWaterResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.hotWater' })
    const ColdWaterResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.coldWater' })
    const ElectricityResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.electricity' })
    const HeatSupplyResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.heatSupply' })
    const GasSupplyResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.gasSupply' })
    const FlatUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.flat' })
    const ParkingUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.parking' })
    const ApartmentUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.apartment' })
    const WarehouseUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.warehouse' })
    const CommercialUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.commercial' })

    const UNIT_TYPE_TRANSLATION_TO_TYPE = useMemo(() => ({
        [FlatUnitTypeValue.toLowerCase()]: FLAT_UNIT_TYPE,
        [ParkingUnitTypeValue.toLowerCase()]: PARKING_UNIT_TYPE,
        [ApartmentUnitTypeValue.toLowerCase()]: APARTMENT_UNIT_TYPE,
        [WarehouseUnitTypeValue.toLowerCase()]: WAREHOUSE_UNIT_TYPE,
        [CommercialUnitTypeValue.toLowerCase()]: COMMERCIAL_UNIT_TYPE,
    }), [ApartmentUnitTypeValue, CommercialUnitTypeValue, FlatUnitTypeValue, ParkingUnitTypeValue, WarehouseUnitTypeValue])

    const METER_RESOURCE_ABBREVIATION_TO_ID = {
        [HotWaterResourceTypeValue]: HOT_WATER_METER_RESOURCE_ID,
        [ColdWaterResourceTypeValue]: COLD_WATER_METER_RESOURCE_ID,
        [ElectricityResourceTypeValue]: ELECTRICITY_METER_RESOURCE_ID,
        [HeatSupplyResourceTypeValue]: HEAT_SUPPLY_METER_RESOURCE_ID,
        [GasSupplyResourceTypeValue]: GAS_SUPPLY_METER_RESOURCE_ID,
    }

    const processMeterReadings: MeterReadingsProcessor = (data) => {
        if (get(data, [0, 0, 'value']) === 'Адрес'){
            data.shift()
        }

        if (!data.length) return []

        const rawMeterReadings = data.map((row) => {
            const [
                address,
                unitName,
                unitType,
                accountNumber,
                meterType,
                meterNumber,
                numberOfTariffs,
                v1, v2, v3, v4,
                readingSubmissionDate,
                verificationDate,
                nextVerificationDate,
                installationDate,
                commissioningDate,
                sealingDate,
                controlReadingsDate,
                place,
            ] = map(row, 'value')

            return {
                accountNumber: String(accountNumber),
                address: String(address),
                unitName: String(unitName),
                unitType: String(unitType),
                resourceType: String(meterType),
                number: String(meterNumber),
                numberOfTariffs: Number(numberOfTariffs),
                date: String(readingSubmissionDate),
                v1: v1 && String(v1),

                // optional fields
                v2: v2 && String(v2),
                v3: v3 && String(v3),
                v4: v4 && String(v4),
                verificationDate: verificationDate && String(verificationDate),
                nextVerificationDate: nextVerificationDate && String(nextVerificationDate),
                installationDate: installationDate && String(installationDate),
                commissioningDate: commissioningDate && String(commissioningDate),
                sealingDate: sealingDate && String(sealingDate),
                controlReadingsDate: controlReadingsDate && String(controlReadingsDate),
                place: place && String(place).trim(),
            }
        })

        console.log('raw: ', rawMeterReadings)
        const processedReadings = {}
        rawMeterReadings.forEach((meterReading) => {
            const {
                accountNumber,
                address,
                unitName,
                unitType,
                resourceType,
                number,
                numberOfTariffs,
                date,

                verificationDate,
                nextVerificationDate,
                installationDate,
                commissioningDate,
                sealingDate,
                controlReadingsDate,
                place,
                v1, v2, v3, v4,
            } = meterReading

            if (!processedReadings[accountNumber]) {
                processedReadings[accountNumber] = {
                    address,
                    addressMeta: {
                        unitType: UNIT_TYPE_TRANSLATION_TO_TYPE[String(unitType).toLowerCase()],
                        unitName,
                    },
                    accountNumber,
                    meters: [],
                }
            }

            // Check if the meter already exists for this account
            const meterIndex = processedReadings[accountNumber].meters.findIndex(meter => meter.number === number)

            if (meterIndex === -1) {
                processedReadings[accountNumber].meters.push({
                    number,
                    resourceTypeId: METER_RESOURCE_ABBREVIATION_TO_ID[String(resourceType)],
                    numberOfTariffs,
                    place,
                    readings: [{ date, v1, v2, v3, v4 }],
                    dates: [{ verificationDate, nextVerificationDate, installationDate, commissioningDate, sealingDate, controlReadingsDate }],
                })
            } else {
                processedReadings[accountNumber].meters[meterIndex].readings.push({ date, v1, v2, v3, v4 })
            }
        })

        return Object.values(processedReadings)
    }

    return [processMeterReadings]
}
