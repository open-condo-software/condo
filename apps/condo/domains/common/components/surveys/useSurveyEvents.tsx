import { Survey } from 'posthog-js'
import { useCallback } from 'react'

import { SurveyResponse } from '@open-condo/surveys'

import { analytics } from '@condo/domains/common/utils/analytics'

type SurveyEventExtraData = Record<string, unknown>

export const useSurveyEvents = () => {
    const captureSurveyShown = useCallback((survey: Survey, extraData: SurveyEventExtraData = {}) => {
        analytics.track('survey shown', {
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
        const responseFields = responses.reduce((acc, r) => {
            acc[`$survey_response_${r.questionId}`] = r.value
            return acc
        }, {} as Record<string, string | string[] | number>)

        analytics.track('survey sent', {
            $survey_id: survey.id,
            $survey_name: survey.name,
            ...responseFields,
            ...extraData,
        })
    }, [])

    const captureSurveyDismissed = useCallback((
        survey: Survey,
        responses: SurveyResponse[] = [],
        extraData: SurveyEventExtraData = {}
    ) => {
        const responseFields = responses.reduce((acc, r) => {
            acc[`$survey_response_${r.questionId}`] = r.value
            return acc
        }, {} as Record<string, string | string[] | number>)

        analytics.track('survey dismissed', {
            $survey_id: survey.id,
            $survey_name: survey.name,
            ...responseFields,
            ...extraData,
        })
    }, [])

    return {
        captureSurveyShown,
        captureSurveyDismissed,
        captureSurveySent,
    }
}