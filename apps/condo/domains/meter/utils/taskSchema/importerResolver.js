const { get, isNil, isEmpty, set } = require('lodash')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { i18n } = require('@open-condo/locales/loader')

const { BIGGER_LIMIT_FOR_IMPORT } = require('@condo/domains/common/constants/featureflags')
const {
    DOMA_EXCEL,
    CANCELLED,
    ERROR,
} = require('@condo/domains/common/constants/import')
const { DEFAULT_RECORDS_LIMIT_FOR_IMPORT } = require('@condo/domains/common/constants/import')
const {
    HOT_WATER_METER_RESOURCE_ID,
    COLD_WATER_METER_RESOURCE_ID,
    ELECTRICITY_METER_RESOURCE_ID,
    HEAT_SUPPLY_METER_RESOURCE_ID,
    GAS_SUPPLY_METER_RESOURCE_ID,
    COLD_AIR_METER_RESOURCE_ID,
    DRAINAGE_METER_RESOURCE_ID,
} = require('@condo/domains/meter/constants/constants')
const {
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT,
    EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
    METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION,
} = require('@condo/domains/meter/constants/errors')
const { DATE_FIELD_PATH_TO_TRANSLATION } = require('@condo/domains/meter/constants/registerMetersReadingsService')
const { MeterReadingsImportTask, registerMetersReadings, registerPropertyMetersReadings } = require('@condo/domains/meter/utils/serverSchema')
const { DomaMetersImporter } = require('@condo/domains/meter/utils/taskSchema/DomaMetersImporter')
const { DomaPropertyMetersImporter } = require('@condo/domains/meter/utils/taskSchema/DomaPropertyMetersImporter')
const { SbbolMetersImporter } = require('@condo/domains/meter/utils/taskSchema/SbbolMetersImporter')
const {
    FLAT_UNIT_TYPE,
    PARKING_UNIT_TYPE,
    APARTMENT_UNIT_TYPE,
    WAREHOUSE_UNIT_TYPE,
    COMMERCIAL_UNIT_TYPE,
} = require('@condo/domains/property/constants/common')
const { USER_FIELDS } = require('@condo/domains/user/gql')
const { User } = require('@condo/domains/user/utils/serverSchema')


const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'import-meter-job' } }

function getColumnNames (format, locale, isPropertyMeters) {
    // A separate translation namespace is used to make import feature independent on other
    // to avoid sudden regressed changes of column names when many clients will already use provided spreadsheet
    const AddressColumnMessage = i18n('meter.import.column.address', { locale })
    const UnitNameColumnMessage = i18n('meter.import.column.unitName', { locale })
    const UnitTypeColumnMessage = i18n('meter.import.column.unitType', { locale })
    const AccountNumberColumnMessage = i18n('meter.import.column.accountNumber', { locale })
    const MeterTypeColumnMessage = i18n('meter.import.column.meterType', { locale })
    const MeterNumberColumnMessage = i18n('meter.import.column.meterNumber', { locale })
    const MeterTariffsNumberColumnMessage = i18n('meter.import.column.meterTariffsNumber', { locale })
    const Value1ColumnMessage = i18n('meter.import.column.value1', { locale })
    const Value2ColumnMessage = i18n('meter.import.column.value2', { locale })
    const Value3ColumnMessage = i18n('meter.import.column.value3', { locale })
    const Value4ColumnMessage = i18n('meter.import.column.value4', { locale })
    const ReadingSubmissionDateMessage = i18n('meter.import.column.meterReadingSubmissionDate', { locale })
    const VerificationDateMessage = i18n('meter.import.column.VerificationDate', { locale })
    const NextVerificationDateMessage = i18n('meter.import.column.NextVerificationDate', { locale })
    const InstallationDateMessage = i18n('meter.import.column.InstallationDate', { locale })
    const CommissioningDateMessage = i18n('meter.import.column.CommissioningDate', { locale })
    const SealingDateMessage = i18n('meter.import.column.SealingDate', { locale })
    const ControlReadingsDate = i18n('meter.import.column.ControlReadingsDate', { locale })
    const PlaceColumnMessage = i18n('meter.import.column.MeterPlace', { locale })
    const AutomaticColumnMessage = i18n('meter.import.column.Automatic', { locale })
    const ArchiveDateColumnMessage = i18n('meter.import.column.ArchiveDate', { locale })

    const unitClientMeterColumns = [
        { name: UnitNameColumnMessage },
        { name: UnitTypeColumnMessage },
        { name: AccountNumberColumnMessage },
    ]

    return format === DOMA_EXCEL ? [
        { name: AddressColumnMessage },
        ...isPropertyMeters ? [] : unitClientMeterColumns,
        { name: MeterTypeColumnMessage },
        { name: MeterNumberColumnMessage },
        { name: MeterTariffsNumberColumnMessage },
        { name: Value1ColumnMessage },
        { name: Value2ColumnMessage },
        { name: Value3ColumnMessage },
        { name: Value4ColumnMessage },
        { name: ReadingSubmissionDateMessage },
        { name: VerificationDateMessage },
        { name: NextVerificationDateMessage },
        { name: InstallationDateMessage },
        { name: CommissioningDateMessage },
        { name: SealingDateMessage },
        { name: ControlReadingsDate },
        ...isPropertyMeters ? [] : [{ name: PlaceColumnMessage }],
        { name: AutomaticColumnMessage },
        { name: ArchiveDateColumnMessage },
    ] : null
}

function getDatesColumnNamesByDatePathInReading (locale) {
    return Object.fromEntries(
        Object.entries(DATE_FIELD_PATH_TO_TRANSLATION).map(([datePath, key]) => [datePath, i18n(key, { locale })])
    )
}

function getMappers (format, locale) {
    const FlatUnitTypeValue = i18n('pages.condo.ticket.field.unitType.flat', { locale })
    const ParkingUnitTypeValue = i18n('pages.condo.ticket.field.unitType.parking', { locale })
    const ApartmentUnitTypeValue = i18n('pages.condo.ticket.field.unitType.apartment', { locale })
    const WarehouseUnitTypeValue = i18n('pages.condo.ticket.field.unitType.warehouse', { locale })
    const CommercialUnitTypeValue = i18n('pages.condo.ticket.field.unitType.commercial', { locale })

    const HotWaterResourceTypeValue = i18n('meter.import.value.meterResourceType.hotWater', { locale })
    const ColdWaterResourceTypeValue = i18n('meter.import.value.meterResourceType.coldWater', { locale })
    const ElectricityResourceTypeValue = i18n('meter.import.value.meterResourceType.electricity', { locale })
    const HeatSupplyResourceTypeValue = i18n('meter.import.value.meterResourceType.heatSupply', { locale })
    const GasSupplyResourceTypeValue = i18n('meter.import.value.meterResourceType.gasSupply', { locale })
    const ColdAirResourceTypeValue = i18n('meter.import.value.meterResourceType.coldAir', { locale })
    const DrainageResourceTypeValue = i18n('meter.import.value.meterResourceType.drainage', { locale })

    const Yes = i18n('Yes', { locale })
    const No = i18n('No', { locale })

    return format === DOMA_EXCEL ? {
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
            [ColdAirResourceTypeValue]: COLD_AIR_METER_RESOURCE_ID,
            [DrainageResourceTypeValue]: DRAINAGE_METER_RESOURCE_ID,
        },
        isAutomatic: {
            [Yes.toLowerCase()]: true,
            [No.toLowerCase()]: false,
        },
    } : {
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
            '11': DRAINAGE_METER_RESOURCE_ID, // Drainage
            '12': '', // Water for irrigation
            '13': '', // Garbage
        },
        isAutomatic: {},
    }
}

async function getErrors (keystone, format, locale, columns, mappers) {
    const maxTableLength = await featureToggleManager.getFeatureValue(
        keystone,
        BIGGER_LIMIT_FOR_IMPORT,
        DEFAULT_RECORDS_LIMIT_FOR_IMPORT,
    )

    const TooManyRowsErrorTitle = i18n('TooManyRowsInTable.title', { locale })
    const TooManyRowsErrorMessage = i18n('TooManyRowsInTable.message', {
        locale,
        meta: { value: maxTableLength },
    })
    const InvalidHeadersErrorTitle = i18n('TableHasInvalidHeaders.title', { locale })
    const EmptyRowsErrorTitle = i18n('EmptyRows.title', { locale })
    const EmptyRowsErrorMessage = i18n('EmptyRows.message', { locale })
    const NotValidRowTypesMessage = i18n('errors.import.InvalidColumnTypes', { locale })
    const NormalizationErrorMessage = i18n('errors.import.NormalizationError', { locale })
    const ValidationErrorMessage = i18n('errors.import.ValidationError', { locale })
    const CreationErrorMessage = i18n('errors.import.CreationError', { locale })

    const UnknownResource =  i18n('meter.import.error.unknownResourceType', { locale, meta: { knownList: Object.keys(mappers.resourceId).join(', ') } })
    const UnknownUnitType =  i18n('meter.import.error.unknownUnitType', { locale, meta: { knownList: Object.keys(mappers.unitType).join(', ') } })
    const UnknownIsAutomatic = i18n('meter.import.error.unknownIsAutomatic', { locale, meta: { knownList: Object.keys(mappers.isAutomatic).join(', ') } })

    const InvalidColumnsMessage = columns ? i18n('TableHasInvalidHeaders.message', { locale, meta: {
        value: columns.map(column => `"${column.name}"`).join(', '),
    } }) : ''

    const columnNameMask = '#####'
    const InvalidDateMessage = i18n('meter.import.error.InvalidDate', { locale, meta: { columnName: columnNameMask, format: [
        i18n('iso.date.format', { locale }),
        i18n('european.date.format', { locale }),
    ].join('", "') } })
    const InvalidDateMessageGetter = (columnName) => InvalidDateMessage.replace(columnNameMask, columnName)

    return {
        tooManyRows: { message: `${TooManyRowsErrorTitle}.${TooManyRowsErrorMessage}` },
        invalidColumns: { message: `${InvalidHeadersErrorTitle}. ${InvalidColumnsMessage}` },
        invalidTypes: { message: NotValidRowTypesMessage },
        normalization: { message: NormalizationErrorMessage },
        validation: { message: ValidationErrorMessage },
        creation: { message: CreationErrorMessage },
        emptyRows: { message: `${EmptyRowsErrorTitle}. ${EmptyRowsErrorMessage}` },
        unknownResource: { message: UnknownResource },
        unknownUnitType: { message: UnknownUnitType },
        unknownIsAutomatic: { message: UnknownIsAutomatic },
        invalidDate: { get: InvalidDateMessageGetter },
    }
}

function getMutationError (locale) {
    const MeterAccountNumberExistInOtherUnitMessage = i18n('meter.import.error.MeterAccountNumberExistInOtherUnit', locale)
    const MeterResourceOwnedByAnotherOrganizationMessage = i18n('api.meter.meter.METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION', locale)
    const MeterNumberExistInOrganizationMessage = i18n('meter.import.error.MeterNumberExistInOrganization', locale)

    return {
        [EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT]: MeterAccountNumberExistInOtherUnitMessage,
        [EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION]: MeterNumberExistInOrganizationMessage,
        [METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION]: MeterResourceOwnedByAnotherOrganizationMessage,
    }
}

async function importRows (keystone, userId, organizationId, rows, isPropertyMeters) {
    // readings meter import must be called with the user context
    const userContext = await keystone.createContext({
        authentication: {
            item: await User.getOne(keystone, { id: userId }, USER_FIELDS),
            listKey: 'User',
        },
    })

    if (get(keystone, ['req', 'locale'])) {
        set(userContext, ['req', 'locale'], keystone.req.locale)
    }

    // call it with user context - require for MeterReadings hooks
    const mutation = isPropertyMeters ? registerPropertyMetersReadings : registerMetersReadings
    
    const { errors, data } = await mutation(userContext, {
        ...dvAndSender,
        organization: { id: organizationId },
        readings: rows,
    })

    let result = get(data, 'result')

    // fatal error proceeding case - throw error in order to fail proceeding job - since this is not recoverable state
    if (isNil(result) && !isEmpty(errors)) {
        throw errors[0]
    }

    return { errors, result }
}

async function breakProcessChecker (keystone, id) {
    const task = await MeterReadingsImportTask.getOne(keystone, { id }, 'status')
    return task.status === CANCELLED
}

async function errorHandler (keystone, id, error) {
    await MeterReadingsImportTask.update(keystone, id, {
        ...dvAndSender,
        status: ERROR,
        errorMessage: error,
    })
}

async function setTotalRows (keystone, id, total) {
    await MeterReadingsImportTask.update(keystone, id, {
        ...dvAndSender,
        totalRecordsCount: total,
    })
}

async function setProcessedRows (keystone, id, processed) {
    await MeterReadingsImportTask.update(keystone, id, {
        ...dvAndSender,
        processedRecordsCount: processed,
    })
}

async function setImportedRows (keystone, id, imported) {
    await MeterReadingsImportTask.update(keystone, id, {
        ...dvAndSender,
        importedRecordsCount: imported,
    })
}

async function getImporter (keystone, taskId, organizationId, userId, format, locale, isPropertyMeters) {
    const MetersImporterClass = format === DOMA_EXCEL ? DomaMetersImporter : SbbolMetersImporter
    const ImporterClass = isPropertyMeters ? DomaPropertyMetersImporter : MetersImporterClass
    const columns = getColumnNames(format, locale, isPropertyMeters)
    const mappers = getMappers(format, locale)
    const errors = await getErrors(keystone, format, locale, columns, mappers)
    const mutationErrorsToMessages = getMutationError(locale)
    const importRowsMutation = async (rows) => await importRows(keystone, userId, organizationId, rows, isPropertyMeters)
    const breakProcessCheckerQuery = async () => await breakProcessChecker(keystone, taskId)
    const setTotalRowsMutation = async (total) => await setTotalRows(keystone, taskId, total)
    const setProcessedRowsMutation = async (processed) => await setProcessedRows(keystone, taskId, processed)
    const setImportedRowsMutation = async (imported) => await setImportedRows(keystone, taskId, imported)
    const errorHandlerMutation = async (error) => await errorHandler(keystone, taskId, error)
    const dateColumnsByReadingDatePaths = getDatesColumnNamesByDatePathInReading(locale)

    return new ImporterClass(
        columns,
        mappers,
        importRowsMutation,
        errors,
        mutationErrorsToMessages,
        breakProcessCheckerQuery,
        setTotalRowsMutation,
        setProcessedRowsMutation,
        setImportedRowsMutation,
        errorHandlerMutation,
        dateColumnsByReadingDatePaths,
    )
}

module.exports = {
    getImporter,
}

