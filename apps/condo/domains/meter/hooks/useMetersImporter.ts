import { RegisterMetersReadingsReadingInput } from '@app/condo/schema'
import { useCallback, useMemo, useRef, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { BIGGER_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/featureflags'
import { DEFAULT_RECORDS_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/import'
import {
    Columns,
    MutationErrorsToMessagesType,
} from '@condo/domains/common/utils/importer'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import {
    ImportDataType, TImporterErrorMessages,
    TMeterImporterMappers,
    TOnMetersUpload,
} from '@condo/domains/meter/components/MetersDataImporterTypes'
import {
    COLD_WATER_METER_RESOURCE_ID,
    ELECTRICITY_METER_RESOURCE_ID,
    GAS_SUPPLY_METER_RESOURCE_ID,
    HEAT_SUPPLY_METER_RESOURCE_ID,
    HOT_WATER_METER_RESOURCE_ID,
} from '@condo/domains/meter/constants/constants'
import {
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT,
    EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
    METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION,
} from '@condo/domains/meter/constants/errors'
import { REGISTER_METERS_READINGS_MUTATION } from '@condo/domains/meter/gql'
import { ProcessedRow } from '@condo/domains/meter/utils/metersImporters/AbstractMetersImporter'
import DomaMetersImporter from '@condo/domains/meter/utils/metersImporters/DomaMetersImporter'
import SbbolMetersImporter from '@condo/domains/meter/utils/metersImporters/SbbolMetersImporter'
import {
    APARTMENT_UNIT_TYPE,
    COMMERCIAL_UNIT_TYPE,
    FLAT_UNIT_TYPE,
    PARKING_UNIT_TYPE,
    WAREHOUSE_UNIT_TYPE,
} from '@condo/domains/property/constants/common'

interface IUseMetersImporterProps {
    setTotalRows: (number) => void,
    setSuccessRows: () => void,
    handleRowError: (row: ProcessedRow) => void,
    onFinish: () => void,
    onError: () => void,
}

function getMetersImporterClass (dataType: ImportDataType) {
    switch (dataType) {
        case ImportDataType.sbbol:
            return SbbolMetersImporter
        case ImportDataType.doma:
            return DomaMetersImporter
        default:
            throw new Error(`Unknown data type ${dataType}`)
    }
}

function useColumnsResolver () {
    const intl = useIntl()

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

    return useCallback((dataType: ImportDataType): Columns => {
        switch (dataType) {
            case ImportDataType.doma:
                return [
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
                ]
            case ImportDataType.sbbol:
                return null
            default:
                throw new Error(`Unknown data type ${dataType}`)
        }
    }, [AccountNumberColumnMessage, AddressColumnMessage, CommissioningDateMessage, ControlReadingsDate,
        InstallationDateMessage, MeterNumberColumnMessage, MeterTariffsNumberColumnMessage, MeterTypeColumnMessage,
        NextVerificationDateMessage, ReadingSubmissionDateMessage, SealingDateMessage, UnitNameColumnMessage,
        UnitTypeColumnMessage, Value1ColumnMessage, Value2ColumnMessage, Value3ColumnMessage, Value4ColumnMessage,
        VerificationDateMessage, PlaceColumnMessage])
}

function useMappersResolver () {
    const intl = useIntl()

    const FlatUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.flat' })
    const ParkingUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.parking' })
    const ApartmentUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.apartment' })
    const WarehouseUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.warehouse' })
    const CommercialUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.commercial' })

    const HotWaterResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.hotWater' })
    const ColdWaterResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.coldWater' })
    const ElectricityResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.electricity' })
    const HeatSupplyResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.heatSupply' })
    const GasSupplyResourceTypeValue = intl.formatMessage({ id: 'meter.import.value.meterResourceType.gasSupply' })

    return useCallback((dataType: ImportDataType): TMeterImporterMappers => {
        switch (dataType) {
            case ImportDataType.doma:
                return {
                    unitType: {
                        [FlatUnitTypeValue.toLowerCase()]: FLAT_UNIT_TYPE,
                        [ParkingUnitTypeValue.toLowerCase()]: PARKING_UNIT_TYPE,
                        [ApartmentUnitTypeValue.toLowerCase()]: APARTMENT_UNIT_TYPE,
                        [WarehouseUnitTypeValue.toLowerCase()]: WAREHOUSE_UNIT_TYPE,
                        [CommercialUnitTypeValue.toLowerCase()]: COMMERCIAL_UNIT_TYPE,
                    },
                    resourceId: {
                        [HotWaterResourceTypeValue]: HOT_WATER_METER_RESOURCE_ID,
                        [ColdWaterResourceTypeValue]: COLD_WATER_METER_RESOURCE_ID,
                        [ElectricityResourceTypeValue]: ELECTRICITY_METER_RESOURCE_ID,
                        [HeatSupplyResourceTypeValue]: HEAT_SUPPLY_METER_RESOURCE_ID,
                        [GasSupplyResourceTypeValue]: GAS_SUPPLY_METER_RESOURCE_ID,
                    },
                }
            case ImportDataType.sbbol:
                return {
                    unitType: {},
                    resourceId: {
                        '1': GAS_SUPPLY_METER_RESOURCE_ID, // Gas,
                        '2': ELECTRICITY_METER_RESOURCE_ID, // Electricity
                        '3': ELECTRICITY_METER_RESOURCE_ID, // Electricity (day) (for 2-tariff meter)
                        '4': ELECTRICITY_METER_RESOURCE_ID, // Electricity (night) (for 2-tariff meter)
                        '5': ELECTRICITY_METER_RESOURCE_ID, // Electricity (peak) (for 3-tariff meter)
                        '6': ELECTRICITY_METER_RESOURCE_ID, // Electricity (day) (for 3-tariff meter)
                        '7': ELECTRICITY_METER_RESOURCE_ID, // Electricity (night) (for 3-tariff meter)
                        '8': HOT_WATER_METER_RESOURCE_ID, // Hot water
                        '9': COLD_WATER_METER_RESOURCE_ID, // Cold water
                        '10': HEAT_SUPPLY_METER_RESOURCE_ID, // Heating
                        '11': '', // Water disposal
                        '12': '', // Water for irrigation
                        '13': '', // Garbage
                    },
                }
            default:
                throw new Error(`Unknown data type ${dataType}`)
        }
    }, [
        ApartmentUnitTypeValue, ColdWaterResourceTypeValue, CommercialUnitTypeValue, ElectricityResourceTypeValue,
        FlatUnitTypeValue, GasSupplyResourceTypeValue, HeatSupplyResourceTypeValue, HotWaterResourceTypeValue,
        ParkingUnitTypeValue, WarehouseUnitTypeValue,
    ])
}

function useErrorsResolver () {
    const intl = useIntl()
    const { useFlagValue } = useFeatureFlags()

    const maxTableLength: number = useFlagValue(BIGGER_LIMIT_FOR_IMPORT) || DEFAULT_RECORDS_LIMIT_FOR_IMPORT

    const TooManyRowsErrorTitle = intl.formatMessage({ id: 'TooManyRowsInTable.title' })
    const TooManyRowsErrorMessage = intl.formatMessage({ id: 'TooManyRowsInTable.message' }, {
        value: maxTableLength,
    })
    const InvalidHeadersErrorTitle = intl.formatMessage({ id: 'TableHasInvalidHeaders.title' })
    const EmptyRowsErrorTitle = intl.formatMessage({ id: 'EmptyRows.title' })
    const EmptyRowsErrorMessage = intl.formatMessage({ id: 'EmptyRows.message' })
    const NotValidRowTypesMessage = intl.formatMessage({ id: 'errors.import.InvalidColumnTypes' })
    const NormalizationErrorMessage = intl.formatMessage({ id: 'errors.import.NormalizationError' })
    const ValidationErrorMessage = intl.formatMessage({ id: 'errors.import.ValidationError' })
    const CreationErrorMessage = intl.formatMessage({ id: 'errors.import.CreationError' })

    return useCallback((type: ImportDataType, columns, mappers: TMeterImporterMappers): TImporterErrorMessages => {
        const UnknownResource = intl.formatMessage({ id: 'meter.import.error.unknownResourceType' }, { knownList: Object.keys(mappers.resourceId).join(',') })
        const UnknownUnitType = intl.formatMessage({ id: 'meter.import.error.unknownUnitType' }, { knownList: Object.keys(mappers.unitType).join(',') })

        return {
            tooManyRows: { title: TooManyRowsErrorTitle, message: TooManyRowsErrorMessage },
            invalidColumns: {
                title: InvalidHeadersErrorTitle,
                message: columns ? intl.formatMessage({ id: 'TableHasInvalidHeaders.message' }, {
                    value: columns.map(column => `"${column.name}"`).join(', '),
                }) : '',
            },
            invalidTypes: { message: NotValidRowTypesMessage },
            normalization: { message: NormalizationErrorMessage },
            validation: { message: ValidationErrorMessage },
            creation: { message: CreationErrorMessage },
            emptyRows: { title: EmptyRowsErrorTitle, message: EmptyRowsErrorMessage },
            unknownResource: { message: UnknownResource },
            unknownUnitType: { message: UnknownUnitType },
        }
    }, [
        CreationErrorMessage, EmptyRowsErrorMessage, EmptyRowsErrorTitle, InvalidHeadersErrorTitle,
        NormalizationErrorMessage, NotValidRowTypesMessage, TooManyRowsErrorMessage, TooManyRowsErrorTitle,
        ValidationErrorMessage, intl,
    ])
}

export const useMetersImporter = (props: IUseMetersImporterProps) => {
    const { setTotalRows, setSuccessRows, handleRowError, onFinish, onError } = props

    const intl = useIntl()

    const MeterAccountNumberExistInOtherUnitMessage = intl.formatMessage({ id: 'meter.import.error.MeterAccountNumberExistInOtherUnit' })
    const MeterResourceOwnedByAnotherOrganizationMessage = intl.formatMessage({ id: 'api.meter.METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION' })
    const MeterNumberExistInOrganizationMessage = intl.formatMessage({ id: 'meter.import.error.MeterNumberExistInOrganization' })

    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)
    const [isImported, setIsImported] = useState(false)
    const importer = useRef(null)
    const { organization } = useOrganization()
    const client = useApolloClient()

    const importRows = useCallback(async (rows: RegisterMetersReadingsReadingInput[]) => {
        const sender = getClientSideSenderInfo()

        return await client.mutate({
            mutation: REGISTER_METERS_READINGS_MUTATION,
            variables: {
                data: {
                    dv: 1,
                    sender,
                    organization: { id: organization.id },
                    readings: rows,
                },
            },
            /**
             * We need to receive both: errors and data from the server.
             * @link https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies
             */
            errorPolicy: 'all',
        })
    }, [client, organization.id])

    const columnsResolver = useColumnsResolver()
    const mappersResolver = useMappersResolver()
    const errorsResolver = useErrorsResolver()

    const mutationErrorsToMessages = useMemo<MutationErrorsToMessagesType>(() => ({
        [EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT]: MeterAccountNumberExistInOtherUnitMessage,
        [EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION]: MeterNumberExistInOrganizationMessage,
        [METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION]: MeterResourceOwnedByAnotherOrganizationMessage,
    }), [MeterAccountNumberExistInOtherUnitMessage, MeterNumberExistInOrganizationMessage, MeterResourceOwnedByAnotherOrganizationMessage])

    const importData = useCallback<TOnMetersUpload>(async (dataType, data) => {
        importer.current = null
        setIsImported(false)
        setError(null)
        setProgress(0)

        const MetersImporterClass = getMetersImporterClass(dataType)
        const columns = columnsResolver(dataType)
        const mappers = mappersResolver(dataType)
        const errors = errorsResolver(dataType, columns, mappers)

        importer.current = new MetersImporterClass(columns, mappers, importRows, errors, mutationErrorsToMessages)

        setTotalRows(Math.max(0, data.length - Number(importer.current.hasColumnsHeaders())))

        importer.current.onProgressUpdate(setProgress)
        importer.current.onError((e) => {
            setError(e)
            importer.current = null
            onError()
        })
        importer.current.onFinish(() => {
            setIsImported(true)
            importer.current = null
            onFinish()
        })
        importer.current.onRowProcessed(setSuccessRows)
        importer.current.onRowFailed(handleRowError)

        await importer.current.import(data)
    }, [columnsResolver, errorsResolver, handleRowError, importRows, mappersResolver, mutationErrorsToMessages, onError, onFinish, setSuccessRows, setTotalRows])

    const breakImport = () => {
        if (importer) {
            importer.current.break()
        }
    }

    return [importData, progress, error, isImported, breakImport, columnsResolver]
}
