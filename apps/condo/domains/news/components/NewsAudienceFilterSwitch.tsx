import omit from 'lodash/omit'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Radio, RadioGroup } from '@open-condo/ui'

import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import {
    NEWS_AUDIENCE_ALL,
    NEWS_AUDIENCE_COMMON,
    NEWS_AUDIENCE_PERSONAL,
} from '@condo/domains/news/utils/audienceFilters'


type NewsAudience = typeof NEWS_AUDIENCE_ALL | typeof NEWS_AUDIENCE_PERSONAL | typeof NEWS_AUDIENCE_COMMON

export const NewsAudienceFilterSwitch: React.FC = () => {
    const intl = useIntl()
    const AllLabel = intl.formatMessage({ id: 'pages.condo.news.filters.audience.all' })
    const PersonalLabel = intl.formatMessage({ id: 'pages.condo.news.filters.audience.personal' })
    const CommonLabel = intl.formatMessage({ id: 'pages.condo.news.filters.audience.common' })

    const router = useRouter()
    const { filters } = useMemo(() => parseQuery(router.query), [router.query])

    const selectedAudience = (filters.audience as NewsAudience) || NEWS_AUDIENCE_ALL
    const [value, setValue] = useState<NewsAudience>(selectedAudience)

    useEffect(() => {
        setValue(selectedAudience)
    }, [selectedAudience])

    const handleRadioChange = useCallback(async (event) => {
        const nextValue = event.target.value as NewsAudience
        setValue(nextValue)

        const newFilters = nextValue === NEWS_AUDIENCE_ALL
            ? omit(filters, ['audience'])
            : { ...omit(filters, ['audience']), audience: nextValue }

        const newParameters = getFiltersQueryData(newFilters)
        await updateQuery(router, { newParameters }, { routerAction: 'replace', shallow: true })
    }, [filters, router])

    return (
        <RadioGroup
            optionType='button'
            value={value}
            onChange={handleRadioChange}
            id='news-audience-filter'
        >
            <Radio key={NEWS_AUDIENCE_ALL} value={NEWS_AUDIENCE_ALL} label={AllLabel} />
            <Radio key={NEWS_AUDIENCE_PERSONAL} value={NEWS_AUDIENCE_PERSONAL} label={PersonalLabel} />
            <Radio key={NEWS_AUDIENCE_COMMON} value={NEWS_AUDIENCE_COMMON} label={CommonLabel} />
        </RadioGroup>
    )
}
