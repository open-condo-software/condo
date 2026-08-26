import omit from 'lodash/omit'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Radio, RadioGroup, Tour } from '@open-condo/ui'
import { useBreakpoints } from '@open-condo/ui/hooks'

import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import {
    NEWS_AUDIENCE_ALL,
    NEWS_AUDIENCE_COMMON,
    NEWS_AUDIENCE_PERSONAL,
} from '@condo/domains/news/utils/tables.utils'


const STORAGE_KEY = 'news-audience-tour-seen'

type NewsAudience = typeof NEWS_AUDIENCE_ALL | typeof NEWS_AUDIENCE_PERSONAL | typeof NEWS_AUDIENCE_COMMON

type NewsAudienceFilterTourProps = {
    title: string
    message: string
    children: React.ReactNode
}

const NewsAudienceFilterTour: React.FC<NewsAudienceFilterTourProps> = ({ title, message, children }) => {
    const { setCurrentStep } = Tour.useTourContext()

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            setCurrentStep(-1)
        }
        document.addEventListener('click', handleClick, true)
        return () => document.removeEventListener('click', handleClick, true)
    }, [setCurrentStep])

    const handleClose = useCallback(() => setCurrentStep(-1), [setCurrentStep])

    return (
        <Tour.TourStep
            step={0}
            title={title}
            message={message}
            onClose={handleClose}
            placement='bottom'
            getPopupContainer={() => document.body}
        >
            {children}
        </Tour.TourStep>
    )
}

export const NewsAudienceFilterSwitch: React.FC = () => {
    const intl = useIntl()
    const AllLabel = intl.formatMessage({ id: 'pages.condo.news.filters.audience.all' })
    const PersonalLabel = intl.formatMessage({ id: 'pages.condo.news.filters.audience.personal' })
    const CommonLabel = intl.formatMessage({ id: 'pages.condo.news.filters.audience.common' })
    const TourTitle = intl.formatMessage({ id: 'pages.condo.news.filters.audience.tour.title' })
    const TourMessage = intl.formatMessage({ id: 'pages.condo.news.filters.audience.tour.message' })

    const { TABLET_SMALL } = useBreakpoints()
    const router = useRouter()
    const { filters } = useMemo(() => parseQuery(router.query), [router.query])

    const selectedAudience = (filters.audience as NewsAudience) || NEWS_AUDIENCE_ALL
    const [value, setValue] = useState<NewsAudience>(selectedAudience)
    const [showTour, setShowTour] = useState(false)

    useEffect(() => {
        setValue(selectedAudience)
    }, [selectedAudience])

    useEffect(() => {
        if (!TABLET_SMALL) return

        try {
            if (localStorage.getItem(STORAGE_KEY) !== '1') {
                setShowTour(true)
            }
        } catch { /* ignore */ }
    }, [TABLET_SMALL])

    const handleRadioChange = useCallback(async (event) => {
        const nextValue = event.target.value as NewsAudience
        setValue(nextValue)

        const newFilters = nextValue === NEWS_AUDIENCE_ALL
            ? omit(filters, ['audience'])
            : { ...omit(filters, ['audience']), audience: nextValue }

        const newParameters = getFiltersQueryData(newFilters)
        await updateQuery(router, { newParameters }, { routerAction: 'replace', shallow: true })
    }, [filters, router])

    const radioGroup = (
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

    if (!showTour) {
        return radioGroup
    }

    return (
        <Tour.Provider>
            <NewsAudienceFilterTour title={TourTitle} message={TourMessage}>
                {radioGroup}
            </NewsAudienceFilterTour>
        </Tour.Provider>
    )
}
