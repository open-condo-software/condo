import { FilterValue } from 'antd/es/table/interface'
import { get } from 'lodash'
import { useIntl } from '@core/next/intl'
import React, { useMemo } from 'react'
import { LOCALES } from '@condo/domains/common/constants/locale'
import {
    getFilterIcon,
} from '@condo/domains/common/components/Table/Filters'
import { useRouter } from 'next/router'
import {
    getSorterMap,
    parseQuery,
} from '@condo/domains/common/utils/tables.utils'
import { getAddressRender, getDateRender, getReadingRender, getTextRender } from '../../common/components/Table/Renders'
import dayjs from 'dayjs'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'

const getFilteredValue = (filters, key: string | Array<string>): FilterValue => get(filters, key, null)

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
    const intl = useIntl()
    const ClientNameMessage = intl.formatMessage({ id: 'Contact' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const UserNameMessage = intl.formatMessage({ id: 'filters.UserName' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.FlatNumber' })
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
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        return [
            {
                title: MeterReadingDateMessage,
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
                title: AddressMessage,
                ellipsis: false,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue(filters, 'address'),
                key: 'address',
                sorter: true,
                width: '10%',
                render: (record) => {
                    const property = get(record, ['meter', 'property'])
                    const unitName = get(record, ['meter', 'unitName'])
                    const text = get(property, 'address')
                    const unitPrefix = unitName ? `${ShortFlatNumber} ${unitName}` : ''

                    const render = getAddressRender(search, unitPrefix)
                    return render(text)
                },
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
                width: '10%',
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
                width: '6%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'place'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: MeterReadingMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'value1'),
                dataIndex: 'value1',
                key: 'value1',
                sorter: true,
                width: '9%',
                render: getReadingRender(search),
            },
            {
                title: ClientNameMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'clientName'),
                render: getTextRender(),
                filterIcon: getFilterIcon,
            },
            {
                title: SourceMessage,
                sortOrder: get(sorterMap, 'source'),
                filteredValue: getFilteredValue(filters, 'source'),
                dataIndex: ['source', 'name'],
                key: 'source',
                sorter: true,
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'source'),
                render: getTextRender(),
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
                render: (createdAt) => {
                    const locale = get(LOCALES, intl.locale)
                    const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
                    return createdAt ? date.format('DD.MM.YYYY') : '-'
                },
            },
            {
                title: CommissioningDateMessage,
                dataIndex: 'commissioningDate',
                key: 'commissioningDate',
                width: '21%',
                render: (createdAt) => {
                    const locale = get(LOCALES, intl.locale)
                    const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
                    return createdAt ? date.format('DD.MM.YYYY') : '-'
                },
            },
            {
                title: SealingDateMessage,
                dataIndex: 'sealingDate',
                key: 'sealingDate',
                width: '20%',
                render: (createdAt) => {
                    const locale = get(LOCALES, intl.locale)
                    const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
                    return createdAt ? date.format('DD.MM.YYYY') : '-'
                },
            },
            {
                title: VerificationDateMessage,
                dataIndex: 'verificationDate',
                key: 'verificationDate',
                width: '17%',
                render: (createdAt) => {
                    const locale = get(LOCALES, intl.locale)
                    const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
                    return createdAt ? date.format('DD.MM.YYYY') : '-'
                },
            },
            {
                title: NextVerificationDateMessage,
                dataIndex: 'nextVerificationDate',
                key: 'nextVerificationDate',
                width: '18%',
                render: (createdAt) => {
                    const locale = get(LOCALES, intl.locale)
                    const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
                    return createdAt ? date.format('DD.MM.YYYY') : '-'
                },
            },
            {
                title: ControlReadingsDateMessage,
                dataIndex: 'controlReadingsDate',
                key: 'controlReadingsDate',
                width: '20%',
                render: (createdAt) => {
                    const locale = get(LOCALES, intl.locale)
                    const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
                    return createdAt ? date.format('DD.MM.YYYY') : '-'
                },
            },
        ]
    }, [])
}

