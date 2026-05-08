import posthog from 'posthog-js'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { isSSR } from '@open-condo/miniapp-utils'

import type { Survey } from 'posthog-js'

export type SurveyResponse = {
    questionId: string
    value: string | string[] | number
}

export type SurveyFeatureFlagPayload = {
    fullscreen?: boolean
    [key: string]: unknown
}

type SurveyEventExtraData = Record<string, unknown>

type PostHogSurveysContextValue = {
    isReady: boolean
    getSurveys: (callback: (surveys: Survey[]) => void) => void
    getSurveyById: (surveyId: string, callback: (survey: Survey | null) => void) => void
    captureSurveyShown: (survey: Survey, extraData?: SurveyEventExtraData) => void
    captureSurveySent: (survey: Survey, responses: SurveyResponse[], extraData?: SurveyEventExtraData) => void
    captureSurveyDismissed: (survey: Survey, responses?: SurveyResponse[], extraData?: SurveyEventExtraData) => void
    getSurveysLinkedFlagValue: (survey: Survey) => any
    getActiveMatchingSurveys: (callback: (surveys: Survey[]) => void) => void
}

const SurveysContext = createContext<PostHogSurveysContextValue | null>(null)

export const SurveysProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [isReady, setIsReady] = useState<boolean>(() => !isSSR() && Boolean(posthog?.__loaded))

    useEffect(() => {
        if (isSSR() || isReady) return

        let checkInterval: ReturnType<typeof setInterval> | null = null

        const timeout = setTimeout(() => {
            if (checkInterval) clearInterval(checkInterval)
        }, 1000)

        checkInterval = setInterval(() => {
            if (posthog?.__loaded) {
                if (checkInterval) clearInterval(checkInterval)
                clearTimeout(timeout)
                setIsReady(true)
            }
        }, 200)

        return () => {
            if (checkInterval) clearInterval(checkInterval)
            clearTimeout(timeout)
        }
    }, [isReady])

    const getSurveys = useCallback((callback: (surveys: Survey[]) => void) => {
        if (!isReady || !posthog?.__loaded) return
        posthog.getSurveys(callback)
    }, [isReady])

    const getActiveMatchingSurveys = useCallback((callback: (surveys: Survey[]) => void) => {
        if (!isReady || !posthog?.__loaded) return
        posthog.getActiveMatchingSurveys(callback)
    }, [isReady])

    const getSurveyById = useCallback((surveyId: string, callback: (survey: Survey | null) => void) => {
        if (!isReady || !posthog?.__loaded) {
            callback(null)
            return
        }
        posthog.getSurveys((surveys) => {
            callback(surveys.find((s) => s.id === surveyId) ?? null)
        })
    }, [isReady])

    const captureSurveyShown = useCallback((survey: Survey, extraData: SurveyEventExtraData = {}) => {
        if (!posthog?.__loaded) return
        posthog.capture('survey shown', {
            $survey_id: survey.id,
            $survey_name: survey.name,
            ...extraData,
        })
    }, [])

    const captureSurveySent = useCallback((
        survey: Survey,
        responses: SurveyResponse[],
        extraData: SurveyEventExtraData = {}
    ) => {
        if (!posthog?.__loaded) return
        const responseFields = responses.reduce((acc, r) => {
            acc[`$survey_response_${r.questionId}`] = r.value
            return acc
        }, {} as Record<string, string | string[] | number>)
        posthog.capture('survey sent', {
            $survey_id: survey.id,
            $survey_name: survey.name,
            $survey_completed: true,
            ...responseFields,
            ...extraData,
        })
    }, [])

    const captureSurveyDismissed = useCallback((
        survey: Survey,
        responses: SurveyResponse[] = [],
        extraData: SurveyEventExtraData = {}
    ) => {
        if (!posthog?.__loaded) return
        const responseFields = responses.reduce((acc, r) => {
            acc[`$survey_response_${r.questionId}`] = r.value
            return acc
        }, {} as Record<string, string | string[] | number>)
        posthog.capture('survey dismissed', {
            $survey_id: survey.id,
            $survey_name: survey.name,
            ...responseFields,
            ...extraData,
        })
    }, [])

    const getSurveysLinkedFlagValue = useCallback((survey: Survey) => {
        const linkedFlagKey = survey.linked_flag_key
        if (linkedFlagKey) {
            const flagValue = posthog.getFeatureFlagResult(linkedFlagKey)?.payload as SurveyFeatureFlagPayload

            if (!flagValue || typeof flagValue !== 'object') return null

            return flagValue
        }

        return null
    }, [])

    const value = useMemo<PostHogSurveysContextValue>(() => ({
        isReady,
        getSurveys,
        getSurveyById,
        captureSurveyShown,
        captureSurveySent,
        getSurveysLinkedFlagValue,
        getActiveMatchingSurveys,
        captureSurveyDismissed,
    }), [
        isReady,
        getSurveys,
        getSurveyById,
        captureSurveyShown,
        captureSurveySent,
        getSurveysLinkedFlagValue,
        getActiveMatchingSurveys,
        captureSurveyDismissed,
    ])


    return (
        <SurveysContext.Provider value={value}>
            {children}
        </SurveysContext.Provider>
    )
}

export const useSurveys = (): PostHogSurveysContextValue => {
    const context = useContext(SurveysContext)

    if (!context) {
        throw new Error('usePostHogSurveys must be used within PostHogSurveysProvider')
    }

    return context
}
