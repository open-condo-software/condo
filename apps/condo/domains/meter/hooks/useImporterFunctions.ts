import { SortMetersBy } from '@app/condo/schema'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import map from 'lodash/map'
import { useEffect, useMemo, useRef } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import {
    APARTMENT_UNIT_TYPE, COMMERCIAL_UNIT_TYPE,
    FLAT_UNIT_TYPE,
    PARKING_UNIT_TYPE,
    WAREHOUSE_UNIT_TYPE,
} from '@app/condo/domains/property/constants/common'
import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import {
    Columns,
    DATE_PARSING_FORMAT,
    ObjectCreator,
    ProcessedRow,
    RowNormalizer,
    RowValidator,
} from '@condo/domains/common/utils/importer'
import {
    COLD_WATER_METER_RESOURCE_ID,
    ELECTRICITY_METER_RESOURCE_ID,
    GAS_SUPPLY_METER_RESOURCE_ID,
    HEAT_SUPPLY_METER_RESOURCE_ID,
    HOT_WATER_METER_RESOURCE_ID,
    IMPORT_CONDO_METER_READING_SOURCE_ID,
} from '@condo/domains/meter/constants/constants'
import { Meter, MeterReading } from '@condo/domains/meter/utils/clientSchema'
import { searchMeter } from '@condo/domains/meter/utils/clientSchema/search'
import { normalizeMeterValue, validateMeterValue } from '@condo/domains/meter/utils/helpers'
import { searchPropertyWithMap } from '@condo/domains/property/utils/clientSchema/search'


const MONTH_PARSING_FORMAT = 'YYYY-MM'

// Will be parsed as date 'YYYY-MM-DD' or month 'YYYY-MM'.
// It is not extracted into `Importer`, because this is the only place of such format yet.
const parseDateOrMonth = (value) => {
    const valueType = value instanceof Date ? 'date' : typeof value
    if (valueType === 'date') {
        return value
    } else if (valueType === 'string') {
        let result = dayjs(value, DATE_PARSING_FORMAT)
        if (!result.isValid()) {
            result = dayjs(value, MONTH_PARSING_FORMAT)
        }
        if (result.isValid()) {
            return result
        }
    }
    throw new RangeError()
}

const mapSectionsToUnitLabels = (sections) => sections.map(
    section => section.floors.map(
        floor => floor.units.map(
            unit => unit.label
        )
    )
).flat(2)

const isValidDate = (date) => {
    return dayjs(date).isValid()
}

const toISO = (str) =>  {
    return dayjs(str).toISOString()
}

export const useImporterFunctions = (): [Columns, RowNormalizer, RowValidator, ObjectCreator] => {
    const intl = useIntl()

    // TODO: change to 'common.import' namespace
    const IncorrectRowFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectRowFormat' })
    const AddressNotFoundMessage = intl.formatMessage({ id: 'errors.import.AddressNotFound' })
    const PropertyNotFoundMessage = intl.formatMessage({ id: 'errors.import.PropertyNotFound' })

    // A separate translation namespace is used to make import feature independent on other
    // to avoid sudden regressed changes of column names when many clients will already use provided spreadsheet
    const AddressColumnMessage = intl.formatMessage({ id: 'meter.import.column.address' })
    const UnitNameColumnMessage = intl.formatMessage({ id: 'meter.import.column.unitName' })
    const UnitTypeColumnMessage = intl.formatMessage({ id: 'meter.import.column.unitType' })
    const AccountNumberColumnMessage = intl.formatMessage({ id: 'meter.import.column.accountNumber' })
    const MeterTypeColumnMessage = intl.formatMessage({ id: 'meter.import.column.meterType' })
    const MeterNumberColumnMessage = intl.formatMessage({ id: 'meter.import.column.meterNumber' })
    const MeterTariffsNumberColumnMessage = intl.formatMessage({ id: 'meter.import.column.meterTariffsNumber' })
    const Value1ColumnMessage = intl.formatMessage({ id: 'meter.import.column.value1' })
    const Value2ColumnMessage = intl.formatMessage({ id: 'meter.import.column.value2' })
    const Value3ColumnMessage = intl.formatMessage({ id: 'meter.import.column.value3' })
    const Value4ColumnMessage = intl.formatMessage({ id: 'meter.import.column.value4' })
    const ReadingSubmissionDateMessage = intl.formatMessage({ id: 'meter.import.column.meterReadingSubmissionDate' })
    const VerificationDateMessage = intl.formatMessage({ id: 'meter.import.column.VerificationDate' })
    const NextVerificationDateMessage = intl.formatMessage({ id: 'meter.import.column.NextVerificationDate' })
    const InstallationDateMessage = intl.formatMessage({ id: 'meter.import.column.InstallationDate' })
    const CommissioningDateMessage = intl.formatMessage({ id: 'meter.import.column.CommissioningDate' })
    const SealingDateMessage = intl.formatMessage({ id: 'meter.import.column.SealingDate' })
    const ControlReadingsDate = intl.formatMessage({ id: 'meter.import.column.ControlReadingsDate' })
    const PlaceColumnMessage = intl.formatMessage({ id: 'meter.import.column.MeterPlace' })
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
    const MeterResourceNotFoundMessage = intl.formatMessage({ id: 'meter.import.error.MeterResourceNotFound' })
    const NoValuesErrorMessage = intl.formatMessage({ id: 'meter.import.error.ZeroValuesSpecified' })
    const IncorrectUnitTypeMessage = intl.formatMessage({ id: 'errors.import.EmptyUnitType' })
    const AccountNumberInvalidValueMessage = intl.formatMessage({ id: 'meter.import.error.AccountNumberInvalidValue' })
    const MeterNumberInvalidValueMessage = intl.formatMessage({ id: 'meter.import.error.MeterNumberInvalidValue' })
    const MeterValue1InvalidMessage = intl.formatMessage({ id: 'meter.import.error.MeterValueInvalid' }, { columnName: Value1ColumnMessage })
    const MeterValue2InvalidMessage = intl.formatMessage({ id: 'meter.import.error.MeterValueInvalid' }, { columnName: Value2ColumnMessage })
    const MeterValue3InvalidMessage = intl.formatMessage({ id: 'meter.import.error.MeterValueInvalid' }, { columnName: Value3ColumnMessage })
    const MeterValue4InvalidMessage = intl.formatMessage({ id: 'meter.import.error.MeterValueInvalid' }, { columnName: Value4ColumnMessage })

    const userOrganization = useOrganization()
    const client = useApolloClient()
    const { addressApi } = useAddressApi()

    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const userOrganizationIdRef = useRef(userOrganization.id)
    useEffect(() => {
        userOrganizationIdRef.current = userOrganizationId
    }, [userOrganizationId])

    const meterCreateAction = Meter.useCreate({})

    const meterReadingCreateAction = MeterReading.useCreate({})

    const columns: Columns = useMemo(() => ([
        { name: AddressColumnMessage, type: 'string', required: true },
        { name: UnitNameColumnMessage, type: 'string', required: true },
        { name: UnitTypeColumnMessage, type: 'string', required: true },
        { name: AccountNumberColumnMessage, type: 'string', required: true },
        { name: MeterTypeColumnMessage, type: 'string', required: true },
        { name: MeterNumberColumnMessage, type: 'string', required: true },
        { name: MeterTariffsNumberColumnMessage, type: 'string', required: true },
        { name: Value1ColumnMessage, type: 'string', required: false },
        { name: Value2ColumnMessage, type: 'string', required: false },
        { name: Value3ColumnMessage, type: 'string', required: false },
        { name: Value4ColumnMessage, type: 'string', required: false },
        { name: ReadingSubmissionDateMessage, type: 'custom', required: true },
        { name: VerificationDateMessage, type: 'date', required: false },
        { name: NextVerificationDateMessage, type: 'date', required: false },
        { name: InstallationDateMessage, type: 'date', required: false },
        { name: CommissioningDateMessage, type: 'date', required: false },
        { name: SealingDateMessage, type: 'date', required: false },
        { name: ControlReadingsDate, type: 'date', required: false },
        { name: PlaceColumnMessage, type: 'string', required: false },
    ]), [AccountNumberColumnMessage, AddressColumnMessage, CommissioningDateMessage, ControlReadingsDate,
        InstallationDateMessage, MeterNumberColumnMessage, MeterTariffsNumberColumnMessage, MeterTypeColumnMessage,
        NextVerificationDateMessage, ReadingSubmissionDateMessage, SealingDateMessage, UnitNameColumnMessage,
        UnitTypeColumnMessage, Value1ColumnMessage, Value2ColumnMessage, Value3ColumnMessage, Value4ColumnMessage,
        VerificationDateMessage, PlaceColumnMessage])

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

    const meterReadingNormalizer: RowNormalizer = async (row) => {
        if (row.length !== columns.length) return { row }
        const [
            address,
            unitName,
            unitType,
            accountNumber,
            meterResourceTypeAbbr,
            meterNumber,
            , // tariffs count
            value1,
            value2,
            value3,
            value4,
            readingSubmissionDate,
            , // verificationDate
            , // nextVerificationDate
            , // installationDate
            , // commissioningDate
            , // sealingDate
            , // controlReadingsDate
            place,
        ] = map(row, 'value')

        const addons = {
            address: null,
            unitType: null,
            propertyId: null,
            propertyMap: null,
            meterId: null,
            meterResourceId: null,
            readingSubmissionDate: null,
            invalidReadingSubmissionDate: null,
            accountNumber: accountNumber ? String(accountNumber).trim() : accountNumber,
            meterNumber: meterNumber ? String(meterNumber).trim() : meterNumber,
            valuesAmount: 0,
            value1: normalizeMeterValue(value1),
            value2: normalizeMeterValue(value2),
            value3: normalizeMeterValue(value3),
            value4: normalizeMeterValue(value4),
            place: place ? String(place).trim() : place,
        }

        addons.valuesAmount = [addons.value1, addons.value2, addons.value3, addons.value4].filter(Boolean).length

        addons.unitType = UNIT_TYPE_TRANSLATION_TO_TYPE[String(unitType).toLowerCase()]
        addons.meterResourceId = METER_RESOURCE_ABBREVIATION_TO_ID[String(meterResourceTypeAbbr)]

        try {
            addons.readingSubmissionDate = parseDateOrMonth(readingSubmissionDate)
        } catch (e) {
            addons.invalidReadingSubmissionDate = true
        }

        // Current suggestion API provider returns no suggestions for address with flat number
        const suggestionOptions = await addressApi.getSuggestions(String(address))
        const suggestion = get(suggestionOptions, ['suggestions', 0])

        if (!suggestion) return { row, addons }

        addons.address = suggestion.value

        // Used tell whether suggestion API has found specified address at all
        const properties = await searchPropertyWithMap(client, {
            organization: { id: userOrganizationIdRef.current },
            address_i: suggestion.value,
        }, undefined)

        const propertyId = !isEmpty(properties) ? get(properties[0], 'id') : null
        const propertyMap = !isEmpty(properties) ? get(properties[0], 'map') : null

        if (!propertyId) return { row, addons }

        addons.propertyId = propertyId
        addons.propertyMap = propertyMap

        const searchMeterWhereConditions = {
            organization: { id: userOrganizationIdRef.current },
            property: { id: propertyId },
            unitName,
            unitType: addons.unitType,
            accountNumber,
            number: meterNumber,
        }

        const meterOptions = await searchMeter(client, searchMeterWhereConditions, SortMetersBy.CreatedAtDesc)
        addons.meterId = meterOptions.length > 0 ? meterOptions[0].value : null

        return { row, addons }
    }

    const meterReadingValidator: RowValidator = async (processedRow) => {
        if (!processedRow) return false
        const errors = []
        if (!processedRow.addons) errors.push(IncorrectRowFormatMessage)

        const address = get(processedRow, ['addons', 'address'])
        const propertyId = get(processedRow, ['addons', 'propertyId'])
        if (!address) errors.push(AddressNotFoundMessage)
        if (address && !propertyId) errors.push(PropertyNotFoundMessage)
        if (!get(processedRow, ['addons', 'meterResourceId'])) errors.push(MeterResourceNotFoundMessage)
        if (!get(processedRow, ['addons', 'valuesAmount'])) errors.push(NoValuesErrorMessage)

        const accountNumber = get(processedRow, ['addons', 'accountNumber'])
        const meterNumber = get(processedRow, ['addons', 'meterNumber'])
        if (!isString(accountNumber) || accountNumber.length < 1) errors.push(AccountNumberInvalidValueMessage)
        if (!isString(meterNumber) || accountNumber.length < 1) errors.push(MeterNumberInvalidValueMessage)

        if (!validateMeterValue(get(processedRow, ['addons', 'value1']))) errors.push(MeterValue1InvalidMessage)
        if (!validateMeterValue(get(processedRow, ['addons', 'value2']))) errors.push(MeterValue2InvalidMessage)
        if (!validateMeterValue(get(processedRow, ['addons', 'value3']))) errors.push(MeterValue3InvalidMessage)
        if (!validateMeterValue(get(processedRow, ['addons', 'value4']))) errors.push(MeterValue4InvalidMessage)

        const unitType = get(processedRow, ['addons', 'unitType'], '')
        if (!unitType || String(unitType).trim().length === 0) errors.push(IncorrectUnitTypeMessage)
        // TODO(mrfoxpro): Implement custom validation https://github.com/open-condo-software/condo/pull/978

        const propertyMap = get(processedRow, ['addons', 'propertyMap'])
        const sections = get(propertyMap, 'sections', [])
        const parking = get(propertyMap, 'parking', [])
        const sectionsUnitLabels = mapSectionsToUnitLabels(sections)
        const parkingUnitLabels = mapSectionsToUnitLabels(parking)

        processedRow.row.forEach((cell, i) => {
            switch (columns[i].name) {
                case ReadingSubmissionDateMessage:
                    if (get(processedRow, ['addons', 'invalidReadingSubmissionDate'])) {
                        errors.push(intl.formatMessage({ id: 'meter.import.error.WrongDateOrMonthFormatMessage' }, { columnName: columns[i].name, format1: DATE_PARSING_FORMAT, format2: MONTH_PARSING_FORMAT }))
                    }
                    break
                case VerificationDateMessage:
                case NextVerificationDateMessage:
                case InstallationDateMessage:
                case CommissioningDateMessage:
                case SealingDateMessage:
                case ControlReadingsDate:
                    if (cell.value && !isValidDate(cell.value)) {
                        errors.push(intl.formatMessage({ id: 'meter.import.error.WrongDateFormatMessage' }, { columnName: columns[i].name, format: DATE_PARSING_FORMAT }))
                    }
                    break
                case UnitNameColumnMessage:
                    if (!propertyId) break
                    if (unitType === PARKING_UNIT_TYPE && parkingUnitLabels.includes(cell.value)) break
                    if (unitType !== PARKING_UNIT_TYPE && sectionsUnitLabels.includes(cell.value)) break

                    errors.push(intl.formatMessage({ id: 'meter.import.error.UnitNameNotFound' }, { columnName: columns[i].name }))
                    break
                default: 
                    break
            }
        })
        if (errors.length) {
            processedRow.errors = errors
            return false
        }
        return true
    }

    const meterReadingCreator: ObjectCreator = async ({ row, addons }: ProcessedRow) => {
        if (!row) return
        const [
            , // address
            unitName,
            , // unitType
            , // accountNumber
            , // meterType
            , // meterNumber
            numberOfTariffs,
            , // value1
            , // value2
            , // value3
            , // value4
            , // readingSubmissionDate
            verificationDate,
            nextVerificationDate,
            installationDate,
            commissioningDate,
            sealingDate,
            controlReadingsDate,
        ] = map(row, 'value')

        let meterId
        if (addons.meterId) {
            meterId = addons.meterId
        } else {
            const newMeter = await meterCreateAction({
                organization: { connect: { id: userOrganizationIdRef.current } },
                property: { connect: { id: String(addons.propertyId) } },
                resource: { connect: { id: addons.meterResourceId } },
                unitName: String(unitName),
                unitType: String(addons.unitType),
                accountNumber: get(addons, 'accountNumber', null),
                number: get(addons, 'meterNumber', null),
                numberOfTariffs: parseInt(String(numberOfTariffs)),
                verificationDate: toISO(verificationDate),
                nextVerificationDate: toISO(nextVerificationDate),
                installationDate: toISO(installationDate),
                commissioningDate: toISO(commissioningDate),
                sealingDate: toISO(sealingDate),
                controlReadingsDate: controlReadingsDate ? toISO(controlReadingsDate) : dayjs().toISOString(),
                place: get(addons, 'place'),
            })
            meterId = get(newMeter, 'id')
        }

        return await meterReadingCreateAction({
            meter: { connect: { id: meterId } },
            source: { connect: { id: IMPORT_CONDO_METER_READING_SOURCE_ID } },
            value1: get(addons, 'value1'),
            value2: get(addons, 'value2'),
            value3: get(addons, 'value3'),
            value4: get(addons, 'value4'),
            date: toISO(addons.readingSubmissionDate),
        })
    }

    return [columns, meterReadingNormalizer, meterReadingValidator, meterReadingCreator]
}
