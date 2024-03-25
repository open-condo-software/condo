import dayjs from 'dayjs'
import get from 'lodash/get'
import { useEffect, useMemo, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import {
    Columns,
} from '@condo/domains/common/utils/importer'

import { ObjectsCreator, ProcessedChunk } from '../utils/meterImporter'

const isValidDate = (date) => {
    return dayjs(date).isValid()
}

const toISO = (str) =>  {
    return dayjs(str).toISOString()
}

export const useMeterImporterFunctions = (): [Columns, ObjectsCreator] => {
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

    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const userOrganizationIdRef = useRef(userOrganization.id)
    useEffect(() => {
        userOrganizationIdRef.current = userOrganizationId
    }, [userOrganizationId])


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

    const meterReadingCreator: ObjectsCreator = async ({ chunk, addons }: ProcessedChunk) => {
        if (!chunk) return
        
        for (const account of chunk) {
            // WIP call uinfied mutation and collect errors if present
        }

        return Promise.resolve()
    }

    return [columns, meterReadingCreator]
}
