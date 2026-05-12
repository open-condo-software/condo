import posthog, { type Survey } from 'posthog-js'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSurveys } from '@open-condo/surveys'

import { SurveyFullscreenModal } from './SurveyFullscreenModal'
import { SurveyModal } from './SurveyModal'


type PostHogSurveysQueueProps = {
    logo?: React.ReactNode
}

export const SurveysQueue: React.FC<PostHogSurveysQueueProps> = () => {
    const { isReady, getActiveMatchingSurveys, getSurveysLinkedFlagValue } = useSurveys()

    const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null)
    const [surveyEventMap, setSurveyEventMap] = useState<Map<string, Survey[]> | null>(null)
    const surveysLoaded = useRef(false)

    useEffect(() => {
        if (!isReady || surveysLoaded.current) return
        posthog.onSurveysLoaded(() => {
            getActiveMatchingSurveys((surveys) => {
                const eventMap = new Map<string, Survey[]>()
                const surveyIdsWithEvents = new Set<string>()

                surveys.forEach((survey) => {
                    const eventNames = survey.conditions?.events?.values?.map((event) => event.name) || []
                    if (eventNames.length > 0) {
                        surveyIdsWithEvents.add(survey.id)
                    }
                    eventNames.forEach((eventName) => {
                        eventMap.set(eventName, [survey])
                    })
                })

                setSurveyEventMap(eventMap)

                const surveysWithoutEvents = surveys.filter((survey) => !surveyIdsWithEvents.has(survey.id))
                setCurrentSurvey(surveysWithoutEvents[0])

                surveysLoaded.current = true
            })
        })
    }, [isReady])

    useEffect(() => {
        if (!isReady || surveyEventMap === null) return

        if (surveyEventMap.size === 0) return

        const eventListener = (e) => {
            const matchingSurveys = surveyEventMap.get(e?.event)
            if (matchingSurveys) {
                setCurrentSurvey(matchingSurveys[0])
            }
        }

        const off = posthog.on('eventCaptured', eventListener)
        return () => off()
    }, [isReady, surveyEventMap])

    const handleClose = useCallback(() => {
        setCurrentSurvey(null)
    }, [])

    const isFullscreen = useMemo(() => {
        if (!currentSurvey) return false

        const flagValue = getSurveysLinkedFlagValue(currentSurvey)

        return Boolean(flagValue?.fullscreen)
    }, [currentSurvey])

    if (!currentSurvey) return null

    if (isFullscreen) {
        return (
            <SurveyFullscreenModal
                surveyId={currentSurvey.id}
                open={true}
                onClose={handleClose}
            />
        )
    }

    return (
        <SurveyModal
            surveyId={currentSurvey.id}
            open={true}
            onClose={handleClose}
        />
    )
}
