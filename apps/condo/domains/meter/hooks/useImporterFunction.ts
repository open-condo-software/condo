import dayjs from 'dayjs'
import { useOrganization } from '@core/next/organization'
import { useApolloClient } from '@core/next/apollo'
import get from 'lodash/get'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import { SortMetersBy } from '@app/condo/schema'
import { useIntl } from '@core/next/intl'

import {
    Columns,
    DATE_PARSING_FORMAT,
    ObjectCreator,
    ProcessedRow,
    RowNormalizer,
    RowValidator,
} from '@condo/domains/common/utils/importer'
import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { searchPropertyWithMap } from '@condo/domains/property/utils/clientSchema/search'

import { Meter, MeterReading } from '../utils/clientSchema'
import { searchMeter } from '../utils/clientSchema/search'
import {
    COLD_WATER_METER_RESOURCE_ID,
    ELECTRICITY_METER_RESOURCE_ID,
    GAS_SUPPLY_METER_RESOURCE_ID,
    HEAT_SUPPLY_METER_RESOURCE_ID,
    HOT_WATER_METER_RESOURCE_ID,
    IMPORT_CONDO_METER_READING_SOURCE_ID,
} from '../constants/constants'

const MONTH_PARSING_FORMAT = 'YYYY-MM'

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

    const MeterResourceNotFoundMessage = intl.formatMessage({ id: 'meter.import.error.MeterResourceNotFound' })

    const HotWaterResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.hotWater' })
    const ColdWaterResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.coldWater' })
    const ElectricityResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.electricity' })
    const HeatSupplyResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.heatSupply' })
    const GasSupplyResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.gasSupply' })

    const userOrganization = useOrganization()
    const client = useApolloClient()
    const { addressApi } = useAddressApi()

    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const meterCreateAction = Meter.useCreate({},
        () => Promise.resolve())

    const meterReadingCreateAction = MeterReading.useCreate({},
        () => Promise.resolve())

    const columns: Columns = [
        { name: AddressColumnMessage, type: 'string', required: true, label: AddressColumnMessage },
        { name: UnitNameColumnMessage, type: 'string', required: true, label: UnitNameColumnMessage },
        { name: AccountNumberColumnMessage, type: 'string', required: true, label: AccountNumberColumnMessage },
        { name: MeterTypeColumnMessage, type: 'string', required: true, label: MeterTypeColumnMessage },
        { name: MeterNumberColumnMessage, type: 'string', required: true, label: MeterNumberColumnMessage },
        { name: MeterTariffsNumberColumnMessage, type: 'string', required: true, label: MeterTariffsNumberColumnMessage },
        { name: Value1ColumnMessage, type: 'string', required: false, label: Value1ColumnMessage },
        { name: Value2ColumnMessage, type: 'string', required: false, label: Value2ColumnMessage },
        { name: Value3ColumnMessage, type: 'string', required: false, label: Value3ColumnMessage },
        { name: Value4ColumnMessage, type: 'string', required: false, label: Value4ColumnMessage },
        // Will be parsed as date 'YYYY-MM-DD' or month 'YYYY-MM'.
        // It is not extracted into `Importer`, because this is the only place of such format yet.
        { name: ReadingSubmissionDateMessage, type: 'string', required: true, label: ReadingSubmissionDateMessage },
        { name: VerificationDateMessage, type: 'date', required: false, label: VerificationDateMessage },
        { name: NextVerificationDateMessage, type: 'date', required: false, label: NextVerificationDateMessage },
        { name: InstallationDateMessage, type: 'date', required: false, label: InstallationDateMessage },
        { name: CommissioningDateMessage, type: 'date', required: false, label: CommissioningDateMessage },
        { name: SealingDateMessage, type: 'date', required: false, label: SealingDateMessage },
        { name: ControlReadingsDate, type: 'date', required: false, label: ControlReadingsDate },
    ]

    const meterReadingNormalizer: RowNormalizer = async (row) => {
        const addons = { address: null, propertyId: null, propertyMap: null, meterId: null, meterResourceId: null, readingSubmissionDate: null }
        if (row.length !== columns.length) return Promise.resolve({ row })
        const [
            address,
            unitName,
            accountNumber,
            meterResourceTypeAbbr,
            meterNumber,
            numberOfTariffs,
            value1,
            value2,
            value3,
            value4,
            readingSubmissionDate,
        ] = map(row, 'value')

        // Current suggestion API provider returns no suggestions for address with flat number
        const suggestionOptions = await addressApi.getSuggestions(String(address))
        const suggestion = get(suggestionOptions, ['suggestions', 0])
        if (!suggestion) {
            return { row, addons }
        }
        // Used tell whether suggestion API has found specified address at all
        addons.address = suggestion.value

        const properties = await searchPropertyWithMap(client, {
            organization: { id: userOrganizationId },
            address: suggestion.value,
        }, undefined)

        const propertyId = !isEmpty(properties) ? get(properties[0], 'id') : null
        const propertyMap = !isEmpty(properties) ? get(properties[0], 'map') : null
        if (!propertyId) {
            return { row, addons }
        }

        addons.propertyId = propertyId
        addons.propertyMap = propertyMap

        const searchMeterWhereConditions = {
            organization: { id: userOrganizationId },
            property: { id: propertyId },
            unitName,
            accountNumber,
            number: meterNumber,
        }

        const meterOptions = await searchMeter(client, searchMeterWhereConditions, SortMetersBy.CreatedAtDesc)
        addons.meterId = meterOptions.length > 0 ? meterOptions[0].value : null

        const METER_RESOURCE_ABBREVIATION_TO_ID = {
            [HotWaterResourceTypeValue]: HOT_WATER_METER_RESOURCE_ID,
            [ColdWaterResourceTypeValue]: COLD_WATER_METER_RESOURCE_ID,
            [ElectricityResourceTypeValue]: ELECTRICITY_METER_RESOURCE_ID,
            [HeatSupplyResourceTypeValue]: HEAT_SUPPLY_METER_RESOURCE_ID,
            [GasSupplyResourceTypeValue]: GAS_SUPPLY_METER_RESOURCE_ID,
        }
        addons.meterResourceId = METER_RESOURCE_ABBREVIATION_TO_ID[String(meterResourceTypeAbbr)]

        let parsedReadingSubmissionDate = dayjs(readingSubmissionDate, DATE_PARSING_FORMAT)
        if (!parsedReadingSubmissionDate.isValid()) {
            parsedReadingSubmissionDate = dayjs(readingSubmissionDate, MONTH_PARSING_FORMAT)
        }
        if (parsedReadingSubmissionDate.isValid()) {
            addons.readingSubmissionDate = parsedReadingSubmissionDate.toDate()
        }

        return { row, addons }
    }

    const meterReadingValidator: RowValidator = (processedRow) => {
        if (!processedRow) return Promise.resolve(false)
        const errors = []
        if (!processedRow.addons) errors.push(IncorrectRowFormatMessage)
        if (!get(processedRow, ['addons', 'address'])) errors.push(AddressNotFoundMessage)
        if (!get(processedRow, ['addons', 'propertyId'])) errors.push(PropertyNotFoundMessage)
        if (!get(processedRow, ['addons', 'meterResourceId'])) errors.push(MeterResourceNotFoundMessage)
        // TODO(mrfoxpro): Implement custom validation https://github.com/open-condo-software/condo/pull/978

        const propertyMap = get(processedRow, ['addons', 'propertyMap'])
        const sections = get(propertyMap, 'sections', [])
        const propertyUnitLabels = sections.map(
            section => section.floors.map(
                floor => floor.units.map(
                    unit => unit.label)
            )
        ).flat(2)

        processedRow.row.forEach((cell, i) => {
            switch (columns[i].label) {
                case ReadingSubmissionDateMessage:
                    if (!get(processedRow, ['addons', 'readingSubmissionDate'])) {
                        errors.push(intl.formatMessage({ id: 'meter.import.error.WrongDateOrMonthFormatMessage' }, { columnName: columns[i].label, format1: DATE_PARSING_FORMAT, format2: MONTH_PARSING_FORMAT }))
                    }
                    break
                case VerificationDateMessage:
                case NextVerificationDateMessage: 
                case InstallationDateMessage: 
                case CommissioningDateMessage: 
                case SealingDateMessage:
                    if (cell.value && !dayjs(cell.value).isValid()) 
                        errors.push(intl.formatMessage({ id: 'meter.import.error.WrongDateFormatMessage' }, { columnName: columns[i].label, format: DATE_PARSING_FORMAT }))
                    break
                case UnitNameColumnMessage:
                    if (!propertyUnitLabels.includes(cell.value))
                        errors.push(intl.formatMessage({ id: 'meter.import.error.UnitNameNotFound' }, { columnName: columns[i].label }))
                    break
                default: 
                    break
            }
        })
        if (errors.length) {
            processedRow.errors = errors
            return Promise.resolve(false)
        }
        return Promise.resolve(true)
    }
    const toISO = (str) =>  {
        return dayjs(str).toISOString()
    }
    const meterReadingCreator: ObjectCreator = async ({ row, addons }: ProcessedRow) => {
        if (!row) return Promise.resolve()
        const [
            address,
            unitName,
            accountNumber,
            meterType,
            meterNumber,
            numberOfTariffs,
            value1,
            value2,
            value3,
            value4,
            readingSubmissionDate,
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
                organization: String(userOrganizationId),
                property: String(addons.propertyId),
                resource: addons.meterResourceId,
                unitName: String(unitName),
                accountNumber: String(accountNumber),
                number: String(meterNumber),
                numberOfTariffs: parseInt(String(numberOfTariffs)),
                verificationDate: toISO(verificationDate),
                nextVerificationDate: toISO(nextVerificationDate),
                installationDate: toISO(installationDate),
                commissioningDate: toISO(commissioningDate),
                sealingDate: toISO(sealingDate),
                controlReadingsDate: controlReadingsDate ? toISO(controlReadingsDate) : dayjs().toISOString(),
            })
            meterId = get(newMeter, 'id')
        }

        return meterReadingCreateAction({
            organization: String(userOrganizationId),
            meter: meterId,
            source: IMPORT_CONDO_METER_READING_SOURCE_ID,
            // GraphQL input requirements for decimal and date field type should be passed as strings.
            // It conflicts with typing system, so they are marked to be ignored by TypeScript
            // @ts-ignore
            value1,
            // @ts-ignore
            value2,
            // @ts-ignore
            value3,
            // @ts-ignore
            value4,
            // @ts-ignore
            date: toISO(addons.readingSubmissionDate),
        })
    }

    return [columns, meterReadingNormalizer, meterReadingValidator, meterReadingCreator]
}
