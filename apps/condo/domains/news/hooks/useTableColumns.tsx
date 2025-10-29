import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { UseNewsTableFiltersReturnType } from '@condo/domains/news/hooks/useTableFilters'
import { getRenderBody, getRenderTitle, getRenderNewsDate, ResendNewsButton, getTypeRender, getRenderProperties } from '@condo/domains/news/utils/clientSchema/NewsRenders'

import { useNewsItemsAccess } from './useNewsItemsAccess'

const COLUMNS_WIDTH = {
    resend: '4%',
    number: '5.8%',
    type: '12%',
    title: '16.1%',
    body: '27.6%',
    compactScopes: '20%',
    createdAt: '14.5%',
}

export const useTableColumns = (filterMetas: UseNewsTableFiltersReturnType) => {
    const intl = useIntl()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const TypeMessage = intl.formatMessage({ id: 'global.type' })
    const TitleMessage = intl.formatMessage({ id: 'Title' })
    const BodyMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.body' })
    const AddressesMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.addresses' })
    const DateMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.date' })

    const router = useRouter()
    const { canManage } = useNewsItemsAccess()
    const { filters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')
    
    const renderResendNews = useCallback((_, newsItem) => {
        const isSentAt = get(newsItem, 'sentAt', null)
        if (!isSentAt || !canManage) return

        return (
            <ResendNewsButton
                intl={intl}
                newsItem={newsItem}
            />
        )
    }, [canManage, intl])

    const renderType = useMemo(() => getTypeRender(intl, search), [intl, search])
    const renderTitle = useMemo(() => getRenderTitle(search), [search])
    const renderBody = useMemo(() => getRenderBody(search), [search])
    const renderProperties = useMemo(() => getRenderProperties(intl, search), [intl, search])
    const renderNewsDate = useMemo(() => getRenderNewsDate(intl, search), [intl, search])

    return useMemo(() => {
        return [
            {
                title: '',
                dataIndex: 'resend',
                key: 'resend',
                width: COLUMNS_WIDTH.resend,
                render: renderResendNews,
            },
            {
                title: NumberMessage,
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: COLUMNS_WIDTH.number,
            },
            {
                title: TypeMessage,
                dataIndex: 'type',
                key: 'type',
                width: COLUMNS_WIDTH.type,
                render: renderType,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'type'),
            },
            {
                title: TitleMessage,
                dataIndex: 'title',
                key: 'title',
                width: COLUMNS_WIDTH.title,
                render: renderTitle,
            },
            {
                title: BodyMessage,
                dataIndex: 'body',
                key: 'body',
                width: COLUMNS_WIDTH.body,
                render: renderBody,
            },
            {
                title: AddressesMessage,
                dataIndex: 'compactScopes',
                key: 'compactScopes',
                width: COLUMNS_WIDTH.compactScopes,
                render: renderProperties,
            },
            {
                title: DateMessage,
                dataIndex: 'createdAt',
                key: 'createdAt',
                width: COLUMNS_WIDTH.createdAt,
                sorter: true,
                render: renderNewsDate,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'createdAt'),
            },
        ]
    }, [renderResendNews, NumberMessage, TypeMessage, renderType, filterMetas, TitleMessage, renderTitle, BodyMessage, renderBody, AddressesMessage, renderProperties, DateMessage, renderNewsDate])
}
