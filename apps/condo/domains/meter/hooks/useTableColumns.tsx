import React, { useMemo } from 'react'
import { FilterValue } from 'antd/es/table/interface'
import { get } from 'lodash'
import { useRouter } from 'next/router'

import { useIntl } from '@core/next/intl'

import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getAddressDetails } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import {
    getAddressRender,
    getDateRender,
    renderMeterReading,
    getTextRender,
    getTableCellRenderer,
} from '@condo/domains/common/components/Table/Renders'

/**
 * TODO: replace with getFilteredValue from @condo/domains/common/utils/helpers (needs IFilters to be defined)
 */
const getFilteredValue = (filters, key: string | Array<string>): FilterValue => get(filters, key, null)

const renderMeterRecord = (record) => {
    const value1 = get(record, 'value1')
    const value2 = get(record, 'value2')
    const value3 = get(record, 'value3')
    const value4 = get(record, 'value4')
    const measure = get(record, ['meter', 'resource', 'measure'])
    const resourceId = get(record, ['meter', 'resource', 'id'])

    return renderMeterReading([value1, value2, value3, value4], resourceId, measure)
}

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
    const intl = useIntl()
    const ClientNameMessage = intl.formatMessage({ id: 'Contact' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const MeterReadingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReadingDate' })
    const ServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.Service' })
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const PlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.Place' })
    const MeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReading' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => {
        let search = String(get(filters, 'search'))

        if (Array.isArray(search)) search = null

        const renderAddress = (record) => {
            const { text, unitPrefix } = getAddressDetails(get(record, ['meter']), ShortFlatNumber)

            return getTableCellRenderer(search, true, unitPrefix)(text)
        }

        return [
            {
                title: MeterReadingDateMessage,
                sortOrder: get(sorterMap, 'date'),
                filteredValue: getFilteredValue(filters, 'date'),
                dataIndex: 'date',
                key: 'date',
                sorter: true,
                width: '10%',
                render: getDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'date'),
            },
            {
                title: AddressMessage,
                ellipsis: false,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue(filters, 'address'),
                key: 'address',
                sorter: true,
                width: '20%',
                render: renderAddress,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                filterIcon: getFilterIcon,
            },
            {
                title: ServiceMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'resource'),
                filteredValue: getFilteredValue(filters, 'resource'),
                dataIndex: ['meter', 'resource', 'name'],
                key: 'resource',
                sorter: true,
                width: '14%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'resource'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: MeterNumberMessage,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue(filters, 'number'),
                dataIndex: ['meter', 'number'],
                key: 'number',
                sorter: true,
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: PlaceMessage,
                sortOrder: get(sorterMap, 'place'),
                filteredValue: getFilteredValue(filters, 'place'),
                dataIndex: ['meter', 'place'],
                key: 'place',
                sorter: true,
                width: '8%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'place'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: MeterReadingMessage,
                ellipsis: false,
                key: 'value',
                width: '15%',
                render: renderMeterRecord,
            },
            {
                title: ClientNameMessage,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '15%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'clientName'),
                render: getTableCellRenderer(search, true),
                filterIcon: getFilterIcon,
            },
            {
                title: SourceMessage,
                sortOrder: get(sorterMap, 'source'),
                filteredValue: getFilteredValue(filters, 'source'),
                dataIndex: ['source', 'name'],
                key: 'source',
                sorter: true,
                width: '8%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'source'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
        ]
    }, [filters])
}

export const useMeterInfoModalTableColumns = () => {
    const intl = useIntl()
    const InstallationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.InstallationDate' })
    const CommissioningDateMessage = intl.formatMessage({ id: 'pages.condo.meter.CommissioningDate' })
    const SealingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.SealingDate' })
    const VerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const NextVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.NextVerificationDate' })
    const ControlReadingsDateMessage = intl.formatMessage({ id: 'pages.condo.meter.ControlReadingsDate' })

    return useMemo(() => {
        return [
            {
                title: InstallationDateMessage,
                dataIndex: 'installationDate',
                key: 'installationDate',
                width: '17%',
                render: getDateRender(intl),
            },
            {
                title: CommissioningDateMessage,
                dataIndex: 'commissioningDate',
                key: 'commissioningDate',
                width: '21%',
                render: getDateRender(intl),
            },
            {
                title: SealingDateMessage,
                dataIndex: 'sealingDate',
                key: 'sealingDate',
                width: '20%',
                render: getDateRender(intl),
            },
            {
                title: VerificationDateMessage,
                dataIndex: 'verificationDate',
                key: 'verificationDate',
                width: '17%',
                render: getDateRender(intl),
            },
            {
                title: NextVerificationDateMessage,
                dataIndex: 'nextVerificationDate',
                key: 'nextVerificationDate',
                width: '18%',
                render: getDateRender(intl),
            },
            {
                title: ControlReadingsDateMessage,
                dataIndex: 'controlReadingsDate',
                key: 'controlReadingsDate',
                width: '20%',
                render: getDateRender(intl),
            },
        ]
    }, [])
}

