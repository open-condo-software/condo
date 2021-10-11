import { FilterValue } from 'antd/es/table/interface'
import { get } from 'lodash'
import { useIntl } from '@core/next/intl'
import { useMemo } from 'react'
import {
    getFilterIcon,
} from '@condo/domains/common/components/Table/Filters'
import { useRouter } from 'next/router'
import {
    getSorterMap,
    parseQuery,
} from '@condo/domains/common/utils/tables.utils'
import { getAddressRender, getDateRender, renderMeterReading, getTextRender } from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getAddressDetails, getIntlMessages, MessageSetMeta } from '@condo/domains/common/utils/helpers'

const getFilteredValue = (filters, key: string | Array<string>): FilterValue => get(filters, key, null)

type TableMessageKeys = 'ClientNameMessage' | 'AddressMessage' | 'ShortFlatNumber' | 'MeterReadingDateMessage'
| 'ServiceMessage' | 'MeterNumberMessage' | 'PlaceMessage' | 'MeterReadingMessage' | 'SourceMessage'

const TABLE_MESSAGES: MessageSetMeta<TableMessageKeys> = {
    ClientNameMessage: { id: 'Contact' },
    AddressMessage: { id: 'field.Address' },
    ShortFlatNumber: { id: 'field.FlatNumber' },
    MeterReadingDateMessage: { id: 'pages.condo.meter.MeterReadingDate' },
    ServiceMessage: { id: 'pages.condo.meter.Service' },
    MeterNumberMessage: { id: 'pages.condo.meter.MeterNumber' },
    PlaceMessage: { id: 'pages.condo.meter.Place' },
    MeterReadingMessage: { id: 'pages.condo.meter.MeterReading' },
    SourceMessage: { id: 'pages.condo.ticket.field.Source' },
}

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
    const intl = useIntl()
    const messages = getIntlMessages<TableMessageKeys>(intl, TABLE_MESSAGES)

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        return [
            {
                title: messages.MeterReadingDateMessage,
                sortOrder: get(sorterMap, 'date'),
                filteredValue: getFilteredValue(filters, 'date'),
                dataIndex: 'date',
                key: 'date',
                sorter: true,
                width: '8%',
                render: getDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'date'),
            },
            {
                title: messages.AddressMessage,
                ellipsis: false,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue(filters, 'address'),
                key: 'address',
                sorter: true,
                width: '10%',
                render: (record) => {
                    const { text, unitPrefix } = getAddressDetails(get(record, ['meter']), messages.ShortFlatNumber)
                    const render = getAddressRender(search, unitPrefix)

                    return render(text)
                },
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                filterIcon: getFilterIcon,
            },
            {
                title: messages.ServiceMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'resource'),
                filteredValue: getFilteredValue(filters, 'resource'),
                dataIndex: ['meter', 'resource', 'name'],
                key: 'resource',
                sorter: true,
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'resource'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: messages.MeterNumberMessage,
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
                title: messages.PlaceMessage,
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
                title: messages.MeterReadingMessage,
                ellipsis: false,
                key: 'value',
                width: '10%',
                render: (record) => {
                    const value1 = get(record, 'value1')
                    const value2 = get(record, 'value2')
                    const value3 = get(record, 'value3')
                    const value4 = get(record, 'value4')
                    const measure = get(record, ['meter', 'resource', 'measure'])
                    const resourceId = get(record, ['meter', 'resource', 'id'])

                    return renderMeterReading([value1, value2, value3, value4], resourceId, measure)
                },
            },
            {
                title: messages.ClientNameMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'clientName'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: messages.SourceMessage,
                sortOrder: get(sorterMap, 'source'),
                filteredValue: getFilteredValue(filters, 'source'),
                dataIndex: ['source', 'name'],
                key: 'source',
                sorter: true,
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'source'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
        ]
    }, [filters])
}

type ModalMessageKeys =
    'InstallationDateMessage' | 'CommissioningDateMessage' | 'SealingDateMessage' | 'VerificationDateMessage' | 'NextVerificationDateMessage' | 'ControlReadingsDateMessage'

const MODAL_MESSAGES: MessageSetMeta<ModalMessageKeys> = {
    InstallationDateMessage: { id: 'pages.condo.meter.InstallationDate' },
    CommissioningDateMessage: { id: 'pages.condo.meter.CommissioningDate' },
    SealingDateMessage: { id: 'pages.condo.meter.SealingDate' },
    VerificationDateMessage: { id: 'pages.condo.meter.VerificationDate' },
    NextVerificationDateMessage: { id: 'pages.condo.meter.NextVerificationDate' },
    ControlReadingsDateMessage: { id: 'pages.condo.meter.ControlReadingsDate' },
}


export const useMeterInfoModalTableColumns = () => {
    const intl = useIntl()
    const messages = getIntlMessages<ModalMessageKeys>(intl, MODAL_MESSAGES)

    return useMemo(() => {
        return [
            {
                title: messages.InstallationDateMessage,
                dataIndex: 'installationDate',
                key: 'installationDate',
                width: '17%',
                render: getDateRender(intl),
            },
            {
                title: messages.CommissioningDateMessage,
                dataIndex: 'commissioningDate',
                key: 'commissioningDate',
                width: '21%',
                render: getDateRender(intl),
            },
            {
                title: messages.SealingDateMessage,
                dataIndex: 'sealingDate',
                key: 'sealingDate',
                width: '20%',
                render: getDateRender(intl),
            },
            {
                title: messages.VerificationDateMessage,
                dataIndex: 'verificationDate',
                key: 'verificationDate',
                width: '17%',
                render: getDateRender(intl),
            },
            {
                title: messages.NextVerificationDateMessage,
                dataIndex: 'nextVerificationDate',
                key: 'nextVerificationDate',
                width: '18%',
                render: getDateRender(intl),
            },
            {
                title: messages.ControlReadingsDateMessage,
                dataIndex: 'controlReadingsDate',
                key: 'controlReadingsDate',
                width: '20%',
                render: getDateRender(intl),
            },
        ]
    }, [])
}

