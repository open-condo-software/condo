const { isNil, isEmpty } = require('lodash')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { i18n } = require('@open-condo/locales/loader')

const { BIGGER_LIMIT_FOR_IMPORT } = require('@condo/domains/common/constants/featureflags')
const {
    IMPORT_FORMAT_VALUES,
    IMPORT_STATUS_VALUES,
    EXCEL,
    CSV,
    PROCESSING,
    CANCELLED,
    ERROR,
    METER_IMPORT_TASK_FOLDER_NAME,
} = require('@condo/domains/common/constants/import')
const { DEFAULT_RECORDS_LIMIT_FOR_IMPORT } = require('@condo/domains/common/constants/import')
const {
    HOT_WATER_METER_RESOURCE_ID,
    COLD_WATER_METER_RESOURCE_ID,
    ELECTRICITY_METER_RESOURCE_ID,
    HEAT_SUPPLY_METER_RESOURCE_ID,
    GAS_SUPPLY_METER_RESOURCE_ID,
} = require('@condo/domains/meter/constants/constants')
const {
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT,
    EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
    METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION,
} = require('@condo/domains/meter/constants/errors')
const { MeterImportTask, registerMetersReadings } = require('@condo/domains/meter/utils/serverSchema')
const {
    FLAT_UNIT_TYPE,
    PARKING_UNIT_TYPE,
    APARTMENT_UNIT_TYPE,
    WAREHOUSE_UNIT_TYPE,
    COMMERCIAL_UNIT_TYPE,
} = require('@condo/domains/property/constants/common')
const { User } = require('@condo/domains/user/utils/serverSchema')

const { DomaMetersImporter } = require('./DomaMetersImporter')
const { SbbolMetersImporter } = require('./SbbolMetersImporter')

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'import-meter-job' } }

function getColumnNames (format) {
    // A separate translation namespace is used to make import feature independent on other
    // to avoid sudden regressed changes of column names when many clients will already use provided spreadsheet
    const AddressColumnMessage = i18n('meter.import.column.address')
    const UnitNameColumnMessage = i18n('meter.import.column.unitName')
    const UnitTypeColumnMessage = i18n('meter.import.column.unitType')
    const AccountNumberColumnMessage = i18n('meter.import.column.accountNumber')
    const MeterTypeColumnMessage = i18n('meter.import.column.meterType')
    const MeterNumberColumnMessage = i18n('meter.import.column.meterNumber')
    const MeterTariffsNumberColumnMessage = i18n('meter.import.column.meterTariffsNumber')
    const Value1ColumnMessage = i18n('meter.import.column.value1')
    const Value2ColumnMessage = i18n('meter.import.column.value2')
    const Value3ColumnMessage = i18n('meter.import.column.value3')
    const Value4ColumnMessage = i18n('meter.import.column.value4')
    const ReadingSubmissionDateMessage = i18n('meter.import.column.meterReadingSubmissionDate')
    const VerificationDateMessage = i18n('meter.import.column.VerificationDate')
    const NextVerificationDateMessage = i18n('meter.import.column.NextVerificationDate')
    const InstallationDateMessage = i18n('meter.import.column.InstallationDate')
    const CommissioningDateMessage = i18n('meter.import.column.CommissioningDate')
    const SealingDateMessage = i18n('meter.import.column.SealingDate')
    const ControlReadingsDate = i18n('meter.import.column.ControlReadingsDate')
    const PlaceColumnMessage = i18n('meter.import.column.MeterPlace')

    return format === EXCEL ? [
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
    ] : null
}

function getMappers (format) {
    const FlatUnitTypeValue = i18n('pages.condo.ticket.field.unitType.flat')
    const ParkingUnitTypeValue = i18n('pages.condo.ticket.field.unitType.parking')
    const ApartmentUnitTypeValue = i18n('pages.condo.ticket.field.unitType.apartment')
    const WarehouseUnitTypeValue = i18n('pages.condo.ticket.field.unitType.warehouse')
    const CommercialUnitTypeValue = i18n('pages.condo.ticket.field.unitType.commercial')

    const HotWaterResourceTypeValue = i18n('meter.import.value.meterResourceType.hotWater')
    const ColdWaterResourceTypeValue = i18n('meter.import.value.meterResourceType.coldWater')
    const ElectricityResourceTypeValue = i18n('meter.import.value.meterResourceType.electricity')
    const HeatSupplyResourceTypeValue = i18n('meter.import.value.meterResourceType.heatSupply')
    const GasSupplyResourceTypeValue = i18n('meter.import.value.meterResourceType.gasSupply')

    return format === EXCEL ? {
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
            '11': '', // Water disposal
            '12': '', // Water for irrigation
            '13': '', // Garbage
        },
    }
}

async function getErrors (keystone, format, columns, mappers) {
    const maxTableLength = await featureToggleManager.getFeatureValue(
        keystone,
        BIGGER_LIMIT_FOR_IMPORT,
        DEFAULT_RECORDS_LIMIT_FOR_IMPORT,
    )

    const TooManyRowsErrorTitle = i18n('TooManyRowsInTable.title')
    const TooManyRowsErrorMessage = i18n('TooManyRowsInTable.message', {
        meta: { value: maxTableLength },
    })
    const InvalidHeadersErrorTitle = i18n('TableHasInvalidHeaders.title')
    const EmptyRowsErrorTitle = i18n('EmptyRows.title')
    const EmptyRowsErrorMessage = i18n('EmptyRows.message')
    const NotValidRowTypesMessage = i18n('errors.import.InvalidColumnTypes')
    const NormalizationErrorMessage = i18n('errors.import.NormalizationError')
    const ValidationErrorMessage = i18n('errors.import.ValidationError')
    const CreationErrorMessage = i18n('errors.import.CreationError')

    const UnknownResource =  i18n('meter.import.error.unknownResourceType', { knownList: Object.keys(mappers.resourceId).join(',') })
    const UnknownUnitType =  i18n('meter.import.error.unknownUnitType', { knownList: Object.keys(mappers.unitType).join(',') })

    return {
        tooManyRows: { title: TooManyRowsErrorTitle, message: TooManyRowsErrorMessage },
        invalidColumns: {
            title: InvalidHeadersErrorTitle,
            message: columns ? i18n('TableHasInvalidHeaders.message', { meta: {
                value: columns.map(column => `"${column.name}"`).join(', '),
            } }) : '',
        },
        invalidTypes: { message: NotValidRowTypesMessage },
        normalization: { message: NormalizationErrorMessage },
        validation: { message: ValidationErrorMessage },
        creation: { message: CreationErrorMessage },
        emptyRows: { title: EmptyRowsErrorTitle, message: EmptyRowsErrorMessage },
        unknownResource: { message: UnknownResource },
        unknownUnitType: { message: UnknownUnitType },
    }
}

function getMutationError () {
    const MeterAccountNumberExistInOtherUnitMessage = i18n('meter.import.error.MeterAccountNumberExistInOtherUnit')
    const MeterResourceOwnedByAnotherOrganizationMessage = i18n('api.meter.METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION')
    const MeterNumberExistInOrganizationMessage = i18n('meter.import.error.MeterNumberExistInOrganization')
    
    return {
        [EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT]: MeterAccountNumberExistInOtherUnitMessage,
        [EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION]: MeterNumberExistInOrganizationMessage,
        [METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION]: MeterResourceOwnedByAnotherOrganizationMessage,
    }
}

async function importRows (keystone, userId, organizationId, rows) {
    // readings meter import must be called with the user context
    const userContext = await keystone.createContext({
        authentication: {
            item: await User.getOne(keystone, { id: userId }),
            listKey: 'User',
        },
    })

    // call it with user context - require for MeterReadings hooks
    const { errors, data: { result } } = await registerMetersReadings(userContext, {
        ...dvAndSender,
        organization: { id: organizationId },
        readings: rows,
    })
    
    // fatal error proceeding case - throw error in order to fail proceeding job - since this is not recoverable state
    if (isNil(result) && !isEmpty(errors)) {
        throw errors[0]
    }
    
    return { errors, result }
}

async function breakProcessChecker (keystone, id) {
    const task = await MeterImportTask.getOne(keystone, { id })
    return task.status === CANCELLED
}

async function errorHandler (keystone, id, error) {
    await MeterImportTask.update(keystone, id, {
        ...dvAndSender,
        status: ERROR,
        errorMessage: error,
    })
}

async function setTotalRows (keystone, id, total) {
    await MeterImportTask.update(keystone, id, {
        ...dvAndSender,
        totalRecordsCount: total,
    })
}

async function setProcessedRows (keystone, id, processed) {
    await MeterImportTask.update(keystone, id, {
        ...dvAndSender,
        processedRecordsCount: processed,
    })
}

async function setImportedRows (keystone, id, imported) {
    await MeterImportTask.update(keystone, id, {
        ...dvAndSender,
        importedRecordsCount: imported,
    })
}

async function getImporter (keystone, taskId, organizationId, userId, format) {
    const MetersImporterClass = format === EXCEL ? DomaMetersImporter : SbbolMetersImporter
    const columns = getColumnNames(format)
    const mappers = getMappers(format)
    const errors = await getErrors(keystone, format, columns, mappers)
    const mutationErrorsToMessages = getMutationError()
    const importRowsMutation = async (rows) => await importRows(keystone, userId, organizationId, rows)
    const breakProcessCheckerQuery = async () => await breakProcessChecker(keystone, taskId)
    const setTotalRowsMutation = async (total) => await setTotalRows(keystone, taskId, total)
    const setProcessedRowsMutation = async (processed) => await setProcessedRows(keystone, taskId, processed)
    const setImportedRowsMutation = async (imported) => await setImportedRows(keystone, taskId, imported)
    const errorHandlerMutation = async (error) => await errorHandler(keystone, taskId, error)

    return new MetersImporterClass(
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
    )
}

module.exports = {
    getImporter,
}