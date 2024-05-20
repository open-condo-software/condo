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
    METER_READINGS_TYPES,
    METER_TAB_TYPES,
    MeterPageTypes,
    MeterReadingsTypes,
} from '@condo/domains/meter/utils/clientSchema'
import {
    getResourceRender,
    getUnitRender,
    getVerificationDateRender,
} from '@condo/domains/meter/utils/clientSchema/Renders'
import { getMeterReportingPeriodRender } from '@condo/domains/ticket/utils/clientSchema/Renders'


const renderMeterRecord = (record) => {
    const value1 = get(record, 'value1')
    const value2 = get(record, 'value2')
    const value3 = get(record, 'value3')
    const value4 = get(record, 'value4')
    const measure = get(record, ['meter', 'resource', 'measure'], '')
    const resourceId = get(record, ['meter', 'resource', 'id'])

    return renderMeterReading([value1, value2, value3, value4], resourceId, measure)
}

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, meterTabType: MeterPageTypes = METER_TAB_TYPES.meterReading, readingsType: MeterReadingsTypes) {
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const MeterReadingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReadingDate' })
    const MeterVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterVerificationDate' })
    const ServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })
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

    const isPropertyMeter = readingsType === METER_READINGS_TYPES.propertyMeterReadings

    const renderAddress = useCallback((_, record) => {
        const property = meterTabType === METER_TAB_TYPES.reportingPeriod ? get(record, ['property']) : get(record, ['meter', 'property'])
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
    }, [meterTabType, DeletedMessage, search, CustomPeriodMessage])

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
            dataIndex: ['meter', 'unitName'],
            width: '12%',
            render: getUnitRender(intl, search),
            filterDropdown: getFilterDropdownByKey(filterMetas, 'unitName'),
            filterIcon: getFilterIcon,
        },
        isPropertyMeter ? undefined : {
            title: AccountNumberMessage,
            filteredValue: getFilteredValue(filters, 'accountNumber'),
            dataIndex: ['meter', 'accountNumber'],
            key: 'accountNumber',
            width: '10%',
            filterDropdown: getFilterDropdownByKey(filterMetas, 'accountNumber'),
            render: getTextRender(search),
            filterIcon: getFilterIcon,
        },
        {
            title: MeterNumberMessage,
            filteredValue: getFilteredValue(filters, 'number'),
            dataIndex: ['meter', 'number'],
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
            render: getResourceRender(intl, search),
            filterIcon: getFilterIcon,
        },
        {
            title: PlaceMessage,
            filteredValue: getFilteredValue(filters, 'place'),
            dataIndex: ['meter', 'place'],
            key: 'place',
            width: isPropertyMeter ? '25%' : '8%',
            filterDropdown: getFilterDropdownByKey(filterMetas, 'place'),
            render: getTextRender(search),
            filterIcon: getFilterIcon,
        },
    ], [AccountNumberMessage, AddressMessage, MeterNumberMessage, PlaceMessage, ServiceMessage, UnitMessage, filterMetas, filters, intl, isPropertyMeter, renderAddress, search])


    return useMemo(() => {
        return meterTabType === METER_TAB_TYPES.reportingPeriod ? [
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
            {
                title: MeterVerificationDateMessage,
                sortOrder: get(sorterMap, 'verificationDate'),
                filteredValue: getFilteredValue(filters, 'verificationDate'),
                dataIndex: ['meter', 'verificationDate'],
                key: 'verificationDate',
                sorter: true,
                width: '11%',
                render: getVerificationDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'verificationDate'),
            },
            // TODO: add isActive field to Meter model
            //* {
            //     title: StatusMessage,
            //     sortOrder: get(sorterMap, 'status'),
            //     filteredValue: getFilteredValue<IFilters>(filters, 'status'),
            //     render: getStatusRender(intl, search),
            //     dataIndex: 'isActive',
            //     key: 'status',
            //     sorter: true,
            //     width: '11%',
            //     filterDropdown: getFilterDropdownByKey(filterMetas, 'isActive'),
            //     filterIcon: getFilterIcon,
            // },
        ])
    }, [meterTabType, AddressMessage, filters, renderAddress, filterMetas, PeriodMessage, sorterMap, search, intl, meterAndMeterReadingColumns, MeterReadingDateMessage, isPropertyMeter, MeterReadingMessage, MeterVerificationDateMessage])
}
