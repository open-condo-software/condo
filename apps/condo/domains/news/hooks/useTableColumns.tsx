import { PropertyWhereInput } from '@app/condo/schema'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getRenderNewsDate, ResendNewsButton, getTypeRender } from '@condo/domains/news/utils/clientSchema/NewsRenders'

const COLUMNS_WIDTH = {
    resend: '4%',
    number: '5.8%',
    type: '12%',
    title: '16.1%',
    kek: '0%',
    body: '27.6%',
    lol: '0:',
    newsItemAddresses: '20%',
    createdAt: '14.5%',
}

export const useTableColumns = (filterMetas: FiltersMeta<PropertyWhereInput>[]) => {
    const intl = useIntl()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const TypeMessage = intl.formatMessage({ id: 'global.type' })
    const TitleMessage = intl.formatMessage({ id: 'Title' })
    const BodyMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.body' })
    const AddressesMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.addresses' })
    const DateMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.date' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')
    
    const renderResendNews = useCallback((_, newsItem) => {
        return (
            <ResendNewsButton
                intl={intl}
                newsItem={newsItem}
            />
        )
    }, [])

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
                render: getTypeRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'type'),
            },
            {
                title: TitleMessage,
                dataIndex: 'title',
                key: 'title',
                width: COLUMNS_WIDTH.title,
            },
            {
                title: BodyMessage,
                dataIndex: 'body',
                key: 'body',
                width: COLUMNS_WIDTH.body,
                className: 'body-column',
                ellipsis: true,
            },
            {
                title: AddressesMessage,
                dataIndex: 'newsItemAddresses',
                key: 'newsItemAddresses',
                width: COLUMNS_WIDTH.newsItemAddresses,
            },
            {
                title: DateMessage,
                dataIndex: 'createdAt',
                key: 'createdAt',
                width: COLUMNS_WIDTH.createdAt,
                sorter: true,
                render: getRenderNewsDate(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'createdAt'),
            },
        ]
        //?4 what i really need here
    }, [intl, search, filterMetas, filters, sorters])
}
