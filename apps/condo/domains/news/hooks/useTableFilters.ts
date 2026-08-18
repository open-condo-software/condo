import { NewsItemWhereInput as INewsItemWhereInput } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ComponentType, TableFiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getDayRangeFilter, getFilter, getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { getNewsAudienceFilter } from '@condo/domains/news/utils/audienceFilters'

const typeFilter = getFilter(['type'], 'array', 'string', 'in')
const filterDateRange = getDayRangeFilter('createdAt')
const bodyFilter = getStringContainsFilter('body')
const titleFilter = getStringContainsFilter('title')
const audienceFilter = getNewsAudienceFilter()

export type UseNewsTableFiltersReturnType = Array<TableFiltersMeta<INewsItemWhereInput>>

export const useTableFilters = (): UseNewsTableFiltersReturnType => {
    const intl = useIntl()
    const TypeMessage = intl.formatMessage({ id: 'global.type' })
    const StartDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.start' })
    const EndDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.end' })
    const CommonTypeMessage = intl.formatMessage({ id: 'news.type.common' })
    const ЕmergencyCommonTypeMessage = intl.formatMessage({ id: 'news.type.emergency' })

    const newsItemTypeOptions = useMemo(() => [
        { label: CommonTypeMessage, value: NEWS_TYPE_COMMON },
        { label: ЕmergencyCommonTypeMessage, value: NEWS_TYPE_EMERGENCY },
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
                // Used by NewsAudienceFilterSwitch in page header (no modal UI)
                keyword: 'audience',
                filters: [audienceFilter],
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