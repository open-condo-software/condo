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
    getAddressRender, getTableCellRenderer,
} from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { METER_PAGE_TYPES, MeterPageTypes } from '@condo/domains/meter/utils/clientSchema'
import { getResourceRender, getUnitRender } from '@condo/domains/meter/utils/clientSchema/Renders'
import {
    getMeterReportingPeriodRender,
    getTicketUserNameRender,
} from '@condo/domains/ticket/utils/clientSchema/Renders'


const renderMeterRecord = (record) => {
    const value1 = get(record, 'value1')
    const value2 = get(record, 'value2')
    const value3 = get(record, 'value3')
    const value4 = get(record, 'value4')
    const measure = get(record, ['meter', 'resource', 'measure'], '')
    const resourceId = get(record, ['meter', 'resource', 'id'])

    return renderMeterReading([value1, value2, value3, value4], resourceId, measure)
}

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, meterPageType: MeterPageTypes = METER_PAGE_TYPES.meter) {
    const intl = useIntl()
    const ClientNameMessage = intl.formatMessage({ id: 'Contact' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const MeterReadingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReadingDate' })
    const ServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const PlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.Place' })
    const MeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReading' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.Account' })
    const PeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.Period' })
    const CustomPeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriod.Table.customPeriod' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const search = getFilteredValue(filters, 'search')

    const isPropertyMeter = meterPageType === METER_PAGE_TYPES.propertyMeter

    const renderAddress = useCallback((_, record) => {
        const property = meterPageType === METER_PAGE_TYPES.reportingPeriod ? get(record, ['property']) : get(record, ['meter', 'property'])
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
    }, [DeletedMessage, search, meterPageType])

    const renderSource = useCallback((source) => getTableCellRenderer({ search })(get(source, 'name')), [search])

    return useMemo(() => {
        return meterPageType === METER_PAGE_TYPES.reportingPeriod ? [
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
        ] : compact([
            {
                title: MeterReadingDateMessage,
                sortOrder: get(sorterMap, 'date'),
                filteredValue: getFilteredValue(filters, 'date'),
                dataIndex: 'date',
                key: 'date',
                sorter: true,
                width: '11%',
                render: getDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'date'),
            },
            {
                title: AddressMessage,
                filteredValue: getFilteredValue(filters, 'address'),
                key: 'address',
                width: '18%',
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
            {
                title: ServiceMessage,
                ellipsis: true,
                filteredValue: getFilteredValue(filters, 'resource'),
                key: 'resource',
                width: '14%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'resource'),
                render: getResourceRender(intl, search),
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
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            isPropertyMeter ? undefined : {
                title: PlaceMessage,
                filteredValue: getFilteredValue(filters, 'place'),
                dataIndex: ['meter', 'place'],
                key: 'place',
                width: '8%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'place'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: MeterReadingMessage,
                ellipsis: false,
                key: 'value',
                width: '12%',
                render: renderMeterRecord,
            },
            isPropertyMeter ? undefined : {
                title: ClientNameMessage,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '12%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'clientName'),
                render: getTicketUserNameRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: SourceMessage,
                sortOrder: get(sorterMap, 'source'),
                filteredValue: getFilteredValue(filters, 'source'),
                dataIndex: 'source',
                key: 'source',
                sorter: true,
                width: '12%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'source'),
                render: renderSource,
                filterIcon: getFilterIcon,
            },
        ])
    }, [meterPageType, MeterReadingDateMessage, sorterMap, filters, intl, search, filterMetas, AddressMessage, renderAddress, UnitMessage, ServiceMessage, AccountNumberMessage, MeterNumberMessage, PlaceMessage, MeterReadingMessage, ClientNameMessage, SourceMessage, renderSource])
}
