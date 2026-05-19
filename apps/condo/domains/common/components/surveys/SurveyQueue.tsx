import posthog, { type Survey } from 'posthog-js'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useSurveys } from '@open-condo/surveys'

import { SurveyModal } from './SurveyModal'


type PostHogSurveysQueueProps = {
    logo?: React.ReactNode
}

export const SurveysQueue: React.FC<PostHogSurveysQueueProps> = () => {
    const { isReady, getActiveSurveys, getSurveys } = useSurveys()

    const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null)
    const [surveyEventMap, setSurveyEventMap] = useState<Map<string, Survey[]> | null>(null)
    const surveysLoaded = useRef(false)
    const activeSurveysLoaded = useRef(false)

    useEffect(() => {
        if (!isReady || activeSurveysLoaded.current) return
        const unsubscribeOnSurveysLoaded = posthog.onSurveysLoaded(() => {
            getActiveSurveys((activeSurveys)=>{
                const eventMap = new Map<string, Survey[]>()
                const surveyIdsWithEvents = new Set<string>()

                activeSurveys.forEach((survey) => {
                    const eventNames = survey.conditions?.events?.values?.map((event) => event.name) || []
                    if (eventNames.length > 0) {
                        surveyIdsWithEvents.add(survey.id)
                    }
                    eventNames.forEach((eventName) => {
                        eventMap.set(eventName, [survey])
                    })
                })

                const surveysWithoutEvents = activeSurveys.filter((survey) => !surveyIdsWithEvents.has(survey.id))
                setCurrentSurvey(surveysWithoutEvents[0])

                activeSurveysLoaded.current = true
            })})

        return () => unsubscribeOnSurveysLoaded()
    }, [isReady])

    useEffect(() => {
        if (!isReady || surveysLoaded.current) return

        const unsubscribeOnSurveysLoaded = posthog.onSurveysLoaded(() => {
            getSurveys((surveys)=> {
                const eventMap = new Map<string, Survey[]>()
                const surveyIdsWithEvents = new Set<string>()

                surveys.forEach((survey) => {
                    if (survey.end_date) return
                    const eventNames = survey.conditions?.events?.values?.map((event) => event.name) || []
                    if (eventNames.length > 0) {
                        surveyIdsWithEvents.add(survey.id)
                    }
                    eventNames.forEach((eventName) => {
                        eventMap.set(eventName, [survey])
                    })
                })

                setSurveyEventMap(eventMap)
                surveysLoaded.current = true
            })
        })

        return () => unsubscribeOnSurveysLoaded()
    }, [isReady])

    useEffect(() => {
        if (!isReady || surveyEventMap === null || surveyEventMap.size === 0) return

        const eventListener = (e) => {
            const matchingSurveys = surveyEventMap.get(e?.event)
            if (matchingSurveys) {
                const survey = matchingSurveys[0]
                setCurrentSurvey(survey)
                if (!survey.conditions.events.repeatedActivation) {
                    const newSurveyEventMap = new Map<string, Survey[]>(surveyEventMap)
                    newSurveyEventMap.delete(e?.event)
                    setSurveyEventMap(newSurveyEventMap)
                }
            }
        }

        const off = posthog.on('eventCaptured', eventListener)
        return () => off()
    }, [isReady, surveyEventMap])

    const handleClose = useCallback(() => {
        setCurrentSurvey(null)
    }, [])

    if (!currentSurvey) return null

    return (
        <SurveyModal
            surveyId={currentSurvey.id}
            open={true}
            onClose={handleClose}
        />
    )
}
