import { FilterValue } from 'antd/es/table/interface'
import { get } from 'lodash'
import { useIntl } from '@core/next/intl'
import React, { useMemo } from 'react'
import { LOCALES } from '@condo/domains/common/constants/locale'
import {
    getFilterIcon,
    getOptionFilterDropdown,
    getTextFilterDropdown,
} from '@condo/domains/common/components/Table/Filters'
import { getDateFilterDropdown } from '../../common/components/Table/Filters'
import { useRouter } from 'next/router'
import { getSorterMap, parseQuery } from '../../common/utils/tables.utils'
import { getTextRender } from '../../common/components/Table/Renders'
import { MeterReadingSource, MeterResource } from '../utils/clientSchema'
import dayjs from 'dayjs'


const getFilteredValue = (filters, key: string | Array<string>): FilterValue => get(filters, key, null)

export const useTableColumns = () => {
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

    const { objs: sources, loading: sourcesLoading } = MeterReadingSource.useObjects({})
    const sourcesOptions = sources.map(source => ({ label: source.name, value: source.id }))

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})
    const resourcesOptions = resources.map(resource => ({ label: resource.name, value: resource.id }))

    return useMemo(() => {
        return [
            {
                title: MeterReadingDateMessage,
                sortOrder: get(sorterMap, 'date'),
                filteredValue: getFilteredValue(filters, 'date'),
                dataIndex: 'date',
                key: 'date',
                sorter: true,
                width: '10%',
                render: (createdAt) => {
                    const locale = get(LOCALES, intl.locale)
                    const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
                    return date.format('DD MMMM')
                },
                filterDropdown: getDateFilterDropdown(),
            },
            {
                title: AddressMessage,
                ellipsis: false,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue(filters, 'address'),
                key: 'address',
                sorter: true,
                width: '12%',
                render: (record) => {
                    const unitName = get(record, 'unitName')
                    const property = get(record, ['meter', 'property'])
                    const text = get(property, 'address')
                    const unitPrefix = unitName ? `${ShortFlatNumber} ${unitName}` : ''

                    return `${text} ${unitPrefix}`
                },
                filterDropdown: getTextFilterDropdown(AddressMessage),
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
                width: '12%',
                filterDropdown: getOptionFilterDropdown(resourcesOptions, resourcesLoading),
                render: getTextRender(),
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
                filterDropdown: getTextFilterDropdown(MeterNumberMessage),
                render: getTextRender(),
                filterIcon: getFilterIcon,
            },
            {
                title: PlaceMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'place'),
                filteredValue: getFilteredValue(filters, 'place'),
                dataIndex: ['meter', 'place'],
                key: 'place',
                sorter: true,
                width: '9%',
                filterDropdown: getTextFilterDropdown(PlaceMessage),
                render: getTextRender(),
                filterIcon: getFilterIcon,
            },
            {
                title: MeterReadingMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'value1'),
                filteredValue: getFilteredValue(filters, 'value1'),
                dataIndex: 'value1',
                key: 'value1',
                sorter: true,
                width: '10%',
                render: getTextRender(),
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
                filterDropdown: getTextFilterDropdown(UserNameMessage),
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
                filterDropdown: getOptionFilterDropdown(sourcesOptions, sourcesLoading),
                render: getTextRender(),
                filterIcon: getFilterIcon,
            },
        ]
    }, [filters])
}
