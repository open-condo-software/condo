import posthog from 'posthog-js'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type { Survey } from 'posthog-js'

export type SurveyResponse = {
    questionId: string
    value: string | string[] | number
}

export type SurveyLinkedValue = {
    fullscreen?: boolean
    [key: string]: unknown
}

type PostHogSurveysContextValue = {
    isReady: boolean
    getSurveys: (callback: (surveys: Survey[]) => void) => void
    getSurveyById: (surveyId: string, callback: (survey: Survey | null) => void) => void
    getSurveysLinkedValue: (survey: Survey) => any
    getActiveSurveys: (callback: (surveys: Survey[]) => void) => void
}

const SurveysContext = createContext<PostHogSurveysContextValue | null>(null)

export const SurveysProvider = ({ children }) => {
    const [isReady, setIsReady] = useState<boolean>(Boolean(posthog?.__loaded))

    useEffect(() => {
        if (isReady) return

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

    const getActiveSurveys = useCallback((callback: (surveys: Survey[]) => void) => {
        if (!isReady || !posthog?.__loaded) return
        posthog.getActiveMatchingSurveys(callback)
    }, [isReady])

    const getSurveyById = useCallback((surveyId: string, callback: (survey: Survey | null) => void) => {
        if (!isReady || !posthog?.__loaded) {
            return
        }
        posthog.getSurveys((surveys) => {
            callback(surveys.find((s) => s.id === surveyId) ?? null)
        })
    }, [isReady])

    const getSurveysLinkedValue = useCallback((survey: Survey) => {
        const linkedFlagKey = survey.linked_flag_key
        if (linkedFlagKey) {
            const flagValue = posthog.getFeatureFlagResult(linkedFlagKey)?.payload as SurveyLinkedValue

            if (!flagValue || typeof flagValue !== 'object') return null

            return flagValue
        }

        return null
    }, [])

    const value = useMemo<PostHogSurveysContextValue>(() => ({
        isReady,
        getSurveys,
        getSurveyById,
        getSurveysLinkedValue,
        getActiveSurveys,
    }), [
        isReady,
        getSurveys,
        getSurveyById,
        getSurveysLinkedValue,
        getActiveSurveys,
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
