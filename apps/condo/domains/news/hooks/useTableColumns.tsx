import { NewsItem as INewsItem, NewsItemWhereInput } from '@app/condo/schema'
import get from 'lodash/get'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { RenderTableCell, TableColumn } from '@open-condo/ui'

import { getFilterComponentByKey, TableFiltersMeta } from '@condo/domains/common/utils/filters.utils'
import {
    getRenderBody,
    getRenderNewsDate,
    getRenderProperties,
    getRenderTitle,
    getTypeRender,
    ResendNewsButton,
} from '@condo/domains/news/utils/clientSchema/NewsRenders'

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

export const useTableColumns = (
    filterMetas: Array<TableFiltersMeta<NewsItemWhereInput>>,
): TableColumn<INewsItem>[] => {
    const intl = useIntl()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const TypeMessage = intl.formatMessage({ id: 'global.type' })
    const TitleMessage = intl.formatMessage({ id: 'Title' })
    const BodyMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.body' })
    const AddressesMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.addresses' })
    const DateMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.date' })

    const { canManage } = useNewsItemsAccess()

    const renderResendNews = useCallback<RenderTableCell<INewsItem>>((_, newsItem) => {
        const isSentAt = get(newsItem, 'sentAt', null)
        if (!isSentAt || !canManage) return null

        return (
            <ResendNewsButton
                intl={intl}
                newsItem={newsItem}
            />
        )
    }, [canManage, intl])

    const renderType = useCallback<RenderTableCell<INewsItem, INewsItem['type']>>(
        (type, newsItem, _, globalFilter) => getTypeRender(intl, globalFilter)(type, newsItem),
        [intl],
    )

    const renderTitle = useCallback<RenderTableCell<INewsItem, INewsItem['title']>>(
        (title, _, __, globalFilter) => getRenderTitle(globalFilter)(title),
        [],
    )

    const renderBody = useCallback<RenderTableCell<INewsItem, INewsItem['body']>>(
        (body, _, __, globalFilter) => getRenderBody(globalFilter)(body),
        [],
    )

    const renderProperties = useCallback<RenderTableCell<INewsItem, INewsItem['compactScopes']>>(
        (compactScopes, _, __, globalFilter) => getRenderProperties(intl, globalFilter)(compactScopes),
        [intl],
    )

    const renderNewsDate = useCallback<RenderTableCell<INewsItem, INewsItem['createdAt']>>(
        (createdAt, newsItem, _, globalFilter) => getRenderNewsDate(intl, globalFilter)(createdAt, newsItem),
        [intl],
    )

    return useMemo(() => [
        {
            id: 'resend',
            header: '',
            render: renderResendNews,
            enableSorting: false,
            enableColumnSettings: false,
            enableColumnResize: false,
            initialSize: COLUMNS_WIDTH.resend,
            minSize: 48,
        },
        {
            id: 'number',
            header: NumberMessage,
            dataKey: 'number',
            enableSorting: true,
            initialSize: COLUMNS_WIDTH.number,
        },
        {
            id: 'type',
            header: TypeMessage,
            dataKey: 'type',
            render: renderType,
            enableSorting: false,
            filterComponent: getFilterComponentByKey(filterMetas, 'type'),
            initialSize: COLUMNS_WIDTH.type,
        },
        {
            id: 'title',
            header: TitleMessage,
            dataKey: 'title',
            render: renderTitle,
            enableSorting: false,
            initialSize: COLUMNS_WIDTH.title,
        },
        {
            id: 'body',
            header: BodyMessage,
            dataKey: 'body',
            render: renderBody,
            enableSorting: false,
            initialSize: COLUMNS_WIDTH.body,
        },
        {
            id: 'compactScopes',
            header: AddressesMessage,
            dataKey: 'compactScopes',
            render: renderProperties,
            enableSorting: false,
            initialSize: COLUMNS_WIDTH.compactScopes,
        },
        {
            id: 'createdAt',
            header: DateMessage,
            dataKey: 'createdAt',
            render: renderNewsDate,
            enableSorting: true,
            filterComponent: getFilterComponentByKey(filterMetas, 'createdAt'),
            initialSize: COLUMNS_WIDTH.createdAt,
        },
    ], [
        AddressesMessage,
        BodyMessage,
        DateMessage,
        NumberMessage,
        TitleMessage,
        TypeMessage,
        filterMetas,
        renderBody,
        renderNewsDate,
        renderProperties,
        renderResendNews,
        renderTitle,
        renderType,
    ])
}
