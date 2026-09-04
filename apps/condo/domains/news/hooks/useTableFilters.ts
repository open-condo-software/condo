import { NewsItemWhereInput as INewsItemWhereInput } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ComponentType, TableFiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getDayRangeFilter, getFilter, getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import { NEWS_ITEM_SOURCE_IDS } from '@condo/domains/news/constants/newsItemSourceIds'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { getNewsAudienceFilter } from '@condo/domains/news/utils/tables.utils'

const typeFilter = getFilter(['type'], 'array', 'string', 'in')
const sourceFilter = getFilter(['source', 'id'], 'array', 'string', 'in')
const filterDateRange = getDayRangeFilter('createdAt')
const bodyFilter = getStringContainsFilter('body')
const titleFilter = getStringContainsFilter('title')
const audienceFilter = getNewsAudienceFilter()

export type UseNewsTableFiltersReturnType = Array<TableFiltersMeta<INewsItemWhereInput>>

export const useTableFilters = (): UseNewsTableFiltersReturnType => {
    const intl = useIntl()
    const TypeMessage = intl.formatMessage({ id: 'global.type' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.source' })
    const StartDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.start' })
    const EndDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.end' })
    const CommonTypeMessage = intl.formatMessage({ id: 'news.type.common' })
    const ЕmergencyCommonTypeMessage = intl.formatMessage({ id: 'news.type.emergency' })
    const NewsFormSourceMessage = intl.formatMessage({ id: 'news.source.NEWS_FORM.name' })
    const RegistrySourceMessage = intl.formatMessage({ id: 'news.source.REGISTRY.name' })

    const newsItemTypeOptions = useMemo(() => [
        { label: CommonTypeMessage, value: NEWS_TYPE_COMMON },
        { label: ЕmergencyCommonTypeMessage, value: NEWS_TYPE_EMERGENCY },
    ], [CommonTypeMessage, ЕmergencyCommonTypeMessage])

    const newsItemSourceOptions = useMemo(() => [
        { label: NewsFormSourceMessage, value: NEWS_ITEM_SOURCE_IDS.NEWS_FORM },
        { label: RegistrySourceMessage, value: NEWS_ITEM_SOURCE_IDS.REGISTRY },
    ], [NewsFormSourceMessage, RegistrySourceMessage])

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
                keyword: 'source',
                filters: [sourceFilter],
                component: {
                    type: ComponentType.Select,
                    options: newsItemSourceOptions,
                    props: {
                        showArrow: true,
                        placeholder: SourceMessage,
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
    }, [TypeMessage, SourceMessage, StartDateMessage, EndDateMessage, newsItemTypeOptions, newsItemSourceOptions])
}