import { MeterReading, PropertyMeterReading } from '@app/condo/schema'
import compact from 'lodash/compact'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import {
    getDateRender,
    renderMeterReading,
    getTextRender,
    getAddressRender,
} from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import {
    METER_TYPES,
    METER_TAB_TYPES,
    MeterPageTypes,
    MeterTypes,
} from '@condo/domains/meter/utils/clientSchema'
import {
    getResourceRender,
    getSourceRender,
    getUnitRender,
    getNextVerificationDateRender,
    getMeterStatusRender,
    getConsumptionRender,
} from '@condo/domains/meter/utils/clientSchema/Renders'
import { getMeterReportingPeriodRender } from '@condo/domains/ticket/utils/clientSchema/Renders'


export const renderMeterRecord = (record) => {
    const value1 = get(record, 'value1')
    const value2 = get(record, 'value2')
    const value3 = get(record, 'value3')
    const value4 = get(record, 'value4')
    const measure = get(record, ['meter', 'resource', 'measure'], '')
    const resourceId = get(record, ['meter', 'resource', 'id'])

    return renderMeterReading([value1, value2, value3, value4], resourceId, measure)
}

export function useTableColumns <T> (
    filterMetas: Array<FiltersMeta<T>>,
    meterTabType: MeterPageTypes = METER_TAB_TYPES.meterReading,
    readingsType: MeterTypes,
    isReadingsForSingleMeter?: boolean,
    records?: Array<MeterReading | PropertyMeterReading>
)
{
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const MeterReadingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReadingDate' })
    const MeterNextVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.NextVerificationDate' })
    const ServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })
    const ConsumptionMessage = intl.formatMessage({ id: 'pages.condo.meter.Consumption' })
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const ContactMessage = intl.formatMessage({ id: 'Contact' })
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const PlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.Place' })
    const MeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReading' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const StatusMessage = intl.formatMessage({ id: 'Status' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.Account' })
    const PeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.Period' })
    const CustomPeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriod.Table.customPeriod' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const search = getFilteredValue(filters, 'search')

    const isPropertyMeter = readingsType === METER_TYPES.property
    const isMeter = meterTabType === METER_TAB_TYPES.meter
    const isReportingPeriod = meterTabType === METER_TAB_TYPES.reportingPeriod

    const renderAddress = useCallback((_, record) => {
        const property = isReportingPeriod || isMeter
            ? get(record, ['property']) : get(record, ['meter', 'property'])
        if (property) {
            return getAddressRender(
                property,
                DeletedMessage,
                search
            )
        }

        if (record.organization) {
            return CustomPeriodMessage
        }
    }, [isReportingPeriod, isMeter, DeletedMessage, search, CustomPeriodMessage])

    const readingsForSingleMeterColumns = useMemo(() => compact([
        {
            title: MeterReadingDateMessage,
            sortOrder: get(sorterMap, 'date'),
            filteredValue: getFilteredValue(filters, 'date'),
            dataIndex: 'date',
            key: 'date',
            sorter: true,
            width: isPropertyMeter ? '25%' : '20%',
            render: getDateRender(intl, search),
            filterDropdown: getFilterDropdownByKey(filterMetas, 'date'),
        },
        {
            title: SourceMessage,
            ellipsis: false,
            key: 'source',
            width: isPropertyMeter ? '25%' : '20%',
            render: getSourceRender(intl, search),
        },
        isPropertyMeter ? undefined : {
            title: ContactMessage,
            ellipsis: false,
            dataIndex: 'clientName',
            key: 'clientName',
            width: isPropertyMeter ? '25%' : '20%',
            render: getTextRender(search),
        },
        isPropertyMeter ? undefined : {
            title: AccountNumberMessage,
            filteredValue: getFilteredValue(filters, 'accountNumber'),
            dataIndex: 'accountNumber',
            key: 'accountNumber',
            width: '15%',
            filterDropdown: getFilterDropdownByKey(filterMetas, 'accountNumber'),
            render: getTextRender(search),
            filterIcon: getFilterIcon,
        },
        {
            title: MeterReadingMessage,
            ellipsis: false,
            key: 'value',
            width: isPropertyMeter ? '25%' : '20%',
            render: renderMeterRecord,
        },
        {
            title: ConsumptionMessage,
            ellipsis: false,
            key: 'consumption',
            width: isPropertyMeter ? '25%' : '20%',
            render: getConsumptionRender(intl, records),
        },
    ]), [AccountNumberMessage, ConsumptionMessage, ContactMessage, MeterReadingDateMessage, MeterReadingMessage, SourceMessage, filterMetas, filters, intl, isPropertyMeter, records, search, sorterMap])

    const meterAndMeterReadingColumns = useMemo(() => [
        {
            title: AddressMessage,
            filteredValue: getFilteredValue(filters, 'address'),
            key: 'address',
            width: isPropertyMeter ? '30%' : '18%',
            render: renderAddress,
            filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
            filterIcon: getFilterIcon,
        },
        isPropertyMeter ? undefined : {
            title: UnitMessage,
            filteredValue: getFilteredValue(filters, 'unitName'),
            key: 'unitName',
            dataIndex: isMeter ? 'unitName' : ['meter', 'unitName'],
            width: '12%',
            render: getUnitRender(intl, search, isMeter),
            filterDropdown: getFilterDropdownByKey(filterMetas, 'unitName'),
            filterIcon: getFilterIcon,
        },
        isPropertyMeter ? undefined : {
            title: AccountNumberMessage,
            filteredValue: getFilteredValue(filters, 'accountNumber'),
            dataIndex: 'accountNumber',
            key: 'accountNumber',
            width: '10%',
            filterDropdown: getFilterDropdownByKey(filterMetas, 'accountNumber'),
            render: getTextRender(search),
            filterIcon: getFilterIcon,
        },
        {
            title: MeterNumberMessage,
            filteredValue: getFilteredValue(filters, 'number'),
            dataIndex: isMeter ? 'number' : ['meter', 'number'],
            key: 'number',
            width: isPropertyMeter ? '20%' : '10%',
            filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
            render: getTextRender(search),
            filterIcon: getFilterIcon,
        },
        {
            title: ServiceMessage,
            ellipsis: true,
            filteredValue: getFilteredValue(filters, 'resource'),
            key: 'resource',
            width: isPropertyMeter ? '25%' : '12%',
            filterDropdown: getFilterDropdownByKey(filterMetas, 'resource'),
            render: getResourceRender(intl, isMeter, search),
            filterIcon: getFilterIcon,
        },
        isPropertyMeter && !isMeter ? undefined : {
            title: PlaceMessage,
            filteredValue: getFilteredValue(filters, 'place'),
            dataIndex: isMeter ? 'place' : ['meter', 'place'],
            key: 'place',
            width: isPropertyMeter ? '25%' : '8%',
            filterDropdown: getFilterDropdownByKey(filterMetas, 'place'),
            render: getTextRender(search),
            filterIcon: getFilterIcon,
        },
    ], [AccountNumberMessage, AddressMessage, MeterNumberMessage, PlaceMessage, ServiceMessage, UnitMessage, filterMetas, filters, intl, isMeter, isPropertyMeter, renderAddress, search])


    return useMemo(() => {
        if (isReadingsForSingleMeter) return readingsForSingleMeterColumns

        return isReportingPeriod ? [
            {
                title: AddressMessage,
                filteredValue: getFilteredValue(filters, 'address'),
                key: 'address',
                width: '70%',
                render: renderAddress,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                filterIcon: getFilterIcon,
            },
            {
                title: PeriodMessage,
                sortOrder: get(sorterMap, 'reportingPeriod'),
                key: 'reportingPeriod',
                sorter: true,
                width: '30%',
                render: getMeterReportingPeriodRender(search, intl),
                filterIcon: getFilterIcon,
            },
        ] : meterTabType === METER_TAB_TYPES.meterReading ? compact([
            ...meterAndMeterReadingColumns,
            {
                title: SourceMessage,
                ellipsis: false,
                key: 'source',
                width: isPropertyMeter ? '25%' : '13%',
                render: getSourceRender(intl, search),
            },
            {
                title: MeterReadingDateMessage,
                sortOrder: get(sorterMap, 'date'),
                filteredValue: getFilteredValue(filters, 'date'),
                dataIndex: 'date',
                key: 'date',
                sorter: true,
                width: isPropertyMeter ? '25%' : '11%',
                render: getDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'date'),
            },
            {
                title: MeterReadingMessage,
                ellipsis: false,
                key: 'value',
                width: isPropertyMeter ? '25%' : '12%',
                render: renderMeterRecord,
            },
        ]) : compact([
            ...meterAndMeterReadingColumns,
            isPropertyMeter ? undefined : {
                title: MeterNextVerificationDateMessage,
                sortOrder: get(sorterMap, 'nextVerificationDate'),
                filteredValue: getFilteredValue(filters, 'nextVerificationDate'),
                dataIndex: isMeter ? 'nextVerificationDate' : ['meter', 'nextVerificationDate'],
                key: 'nextVerificationDate',
                sorter: true,
                width: '11%',
                render: getNextVerificationDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'nextVerificationDate'),
            },
            {
                title: StatusMessage,
                sortOrder: get(sorterMap, 'status'),
                render: getMeterStatusRender(intl, search),
                dataIndex: 'archiveDate',
                key: 'archiveDate',
                width: isPropertyMeter ? '17%' : '14%',
            },
            
        ])
    }, [isReadingsForSingleMeter, readingsForSingleMeterColumns, isReportingPeriod, AddressMessage, filters, renderAddress, filterMetas, PeriodMessage, sorterMap, search, intl, meterTabType, meterAndMeterReadingColumns, SourceMessage, isPropertyMeter, MeterReadingDateMessage, MeterReadingMessage, MeterNextVerificationDateMessage, isMeter, StatusMessage])
}
