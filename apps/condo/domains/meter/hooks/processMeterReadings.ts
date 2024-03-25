import get from 'lodash/get'
import map from 'lodash/map'

type MeterReading = {
    date: Date
    value1: number | string | null
    value2: number | string | null
    value3: number | string | null
    value4: number | string | null
}
type Meter = {
    nextVerificationDate: Date
    number: string | number
    resourceType: string
    readings: Array<MeterReading>
}
type ProcessedMeterReading = {
    account: string | number
    address: string
    meters: Array<Meter>
}

type ReadingsData = Array<Array<Record<'value', string | number>>>
type MeterReadingsProcessor = (data: ReadingsData) => ProcessedReadings
export type ProcessedReadings = Array<ProcessedMeterReading>


export const processMeterReadings: MeterReadingsProcessor = (data) => {
    if (get(data, [0, 0, 'value']) === 'Адрес'){
        data.shift()
    }

    if (!data.length) return []

    const rawMeterReadings = data.map((row) => {
        const [
            address,
            , //unitName
            , //unitType
            accountNumber,
            meterType,
            meterNumber,
            , //numberOfTariffs
            value1,
            value2,
            value3,
            value4,
            readingSubmissionDate,
            , // verificationDate
            nextVerificationDate,
        ] = map(row, 'value')


        return {
            account: accountNumber,
            address: address,
            resourceType: meterType,
            number: meterNumber,
            nextVerificationDate: nextVerificationDate,
            date: readingSubmissionDate,
            value1: value1 || null,
            value2: value2 || null,
            value3: value3 || null,
            value4: value4 || null,
        }
    })

    const processedReadings = {}
    rawMeterReadings.forEach((meterReading) => {
        const {
            account,
            address,
            nextVerificationDate,
            date,
            number,
            resourceType,
            value1, value2, value3, value4,
        } = meterReading

        if (!processedReadings[account]) {
            processedReadings[account] = {
                account,
                address,
                meters: [],
            }
        }

        // Check if the meter already exists for this account
        const meterIndex = processedReadings[account].meters.findIndex(meter => meter.number === number)

        if (meterIndex === -1) {
            processedReadings[account].meters.push({
                resourceType,
                number,
                nextVerificationDate,
                readings: [{
                    date,
                    value1,
                    value2,
                    value3,
                    value4,
                }],
            })
        } else {
            processedReadings[account].meters[meterIndex].readings.push({
                date,
                value1,
                value2,
                value3,
                value4,
            })
        }
    })

    return Object.values(processedReadings)
}