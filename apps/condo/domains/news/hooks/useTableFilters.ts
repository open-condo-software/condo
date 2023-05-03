import {
    NewsItem,
    NewsItemWhereInput,
} from '@app/condo/schema'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getFilter, getDayRangeFilter, getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'

const typeFilter = getFilter(['type'], 'array', 'string', 'in')
const filterDateRange = getDayRangeFilter('createdAt')
const bodyFilter = getStringContainsFilter('body')
const titleFilter = getStringContainsFilter('title')

export const useTableFilters = (): Array<FiltersMeta<NewsItemWhereInput, NewsItem>> => {
    const intl = useIntl()
    const TypeMessage = intl.formatMessage({ id: 'global.type' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const CommonTypeMessage = intl.formatMessage({ id: 'news.type.common' })
    const ЕmergencyCommonTypeMessage = intl.formatMessage({ id: 'news.type.emergency' })

    const newsItemTypeOptions = useMemo(() => [
        { label: CommonTypeMessage, value: 'common' },
        { label: ЕmergencyCommonTypeMessage, value: 'emergency' },
    ], [CommonTypeMessage, ЕmergencyCommonTypeMessage])

    return useMemo(() => {
        return [
            {   
                keyword: 'search', 
                filters: [
                    titleFilter,
                    bodyFilter,
                ], 
                combineType: 'OR',
            },
            {
                keyword: 'type',
                filters: [typeFilter],
                component: {
                    type: ComponentType.Select,
                    options: newsItemTypeOptions,
                    props: {
                        showArrow: true,
                        placeholder: TypeMessage,
                    },
                },
            },
            {
                keyword: 'createdAt',
                filters: [filterDateRange],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                },
            },
        ]
    }, [TypeMessage, StartDateMessage, EndDateMessage, newsItemTypeOptions])
}