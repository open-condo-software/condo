import React, { useCallback, useEffect, useMemo, useState } from 'react'

import  { type SurveyResponse, useSurveys } from '@open-condo/surveys'

import { DefaultSurveyModal } from './DefaultSurveyModal'
import { SurveyFullscreenModal } from './SurveyFullscreenModal'
import { getSurveyQuestionValue } from './SurveyQuestionContent'
import { useSurveyEvents } from './useSurveyEvents'

import type { SurveyQuestionState } from './SurveyQuestionContent'
import type { Survey, SurveyQuestion } from 'posthog-js'

type PostHogSurveyModalProps = {
    surveyId: string
    open: boolean
    onClose: () => void
    extraEventData?: Record<string, unknown>
}

export interface ModalProps {
    modalTitle: string
    canGoBack: boolean
    currentQuestion: SurveyQuestion
    survey: Survey
    open: boolean
    questionState: SurveyQuestionState
    currentQuestionIndex: number
    goToPreviousQuestion: () => void
    handleSubmit: () => void
    handleClose?: () => void
    handleQuestionStateChange: (state: SurveyQuestionState) => void
}

export const SurveyModal: React.FC<PostHogSurveyModalProps> = ({
    surveyId,
    open,
    onClose,
    extraEventData = {},
}) => {
    const {
        isReady,
        getSurveyById,
        getSurveysLinkedValue,
    } = useSurveys()

    const {
        captureSurveyShown,
        captureSurveySent,
        captureSurveyDismissed,
    } = useSurveyEvents()

    const [survey, setSurvey] = useState<Survey | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [responses, setResponses] = useState<SurveyResponse[]>([])
    const [surveyShownEventSent, setSurveyShownEventSent] = useState(false)
    const [questionState, setQuestionState] = useState<SurveyQuestionState>({ value: null, isValid: false })

    useEffect(() => {
        if (!isReady || !open || !surveyId) return

        getSurveyById(surveyId, (survey) => {
            setSurvey(survey)}
        )
    }, [isReady, open, surveyId, getSurveyById])

    useEffect(() => {
        if (survey && open && !surveyShownEventSent) {
            captureSurveyShown(survey, extraEventData)
            setSurveyShownEventSent(true)
        }
    }, [survey, open, surveyShownEventSent, captureSurveyShown, extraEventData])

    const handleClose = useCallback(() => {
        if (survey) {
            captureSurveyDismissed(survey, responses, extraEventData)
        }
        setSurvey(null)
        setCurrentQuestionIndex(0)
        setResponses([])
        setSurveyShownEventSent(false)
        onClose()
    }, [survey, captureSurveyDismissed, extraEventData, onClose, responses])

    const completeSurvey = useCallback((finalResponses?: SurveyResponse[]) => {
        if (!survey) return

        const responsesToUse = finalResponses || responses

        captureSurveySent(survey, responsesToUse, extraEventData)
        setSurvey(null)
        setCurrentQuestionIndex(0)
        setResponses([])
        setSurveyShownEventSent(false)
        onClose()
    }, [survey, responses, captureSurveySent, extraEventData, onClose])

    const handleQuestionStateChange = useCallback((state: SurveyQuestionState) => {
        setQuestionState(state)
    }, [])

    const goToNextQuestion = useCallback((nextResponses: SurveyResponse[] = responses) => {
        if (!survey) return

        const currentQuestion = survey.questions[currentQuestionIndex]
        const currentResponse = nextResponses.find((r) => r.questionId === currentQuestion.id)

        if (currentQuestion.branching?.type === 'response_based' && currentResponse) {
            const responseValues = currentQuestion.branching.responseValues
            if (responseValues && 'choices' in currentQuestion && currentQuestion.choices) {
                const choiceIndex = currentQuestion.choices.indexOf(currentResponse.value as string)
                if (choiceIndex !== undefined && choiceIndex >= 0) {
                    const nextQuestionIndex = responseValues[choiceIndex]
                    if (nextQuestionIndex !== undefined) {
                        handleQuestionStateChange({ isValid: false, value: null })
                        setCurrentQuestionIndex(nextQuestionIndex)
                        return
                    }
                }
            }
        }

        handleQuestionStateChange({ isValid: false, value: null })
        if (currentQuestion.branching?.type === 'end') {
            completeSurvey(nextResponses)
            return
        }

        if (currentQuestionIndex < survey.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
            completeSurvey(nextResponses)
        }
    }, [survey, currentQuestionIndex, responses, completeSurvey])

    const currentQuestion = useMemo(() => {
        return survey?.questions[currentQuestionIndex] || null
    }, [survey, currentQuestionIndex])

    const handleSubmit = useCallback(() => {
        if (!survey || !currentQuestion) return

        if (!questionState.isValid) return

        const value = getSurveyQuestionValue(currentQuestion, questionState)
        const questionId = currentQuestion.id

        const existingIndex = responses.findIndex((r) => r.questionId === questionId)
        const nextResponses = existingIndex >= 0
            ? responses.map((r, i) => i === existingIndex ? { questionId, value } : r)
            : [...responses, { questionId, value }]

        setResponses(nextResponses)
        goToNextQuestion(nextResponses)
    }, [survey, currentQuestion, questionState, responses, goToNextQuestion])

    const modalTitle = useMemo(() => {
        return currentQuestion?.question || ''
    }, [currentQuestion])

    const canGoBack = currentQuestionIndex > 0

    const goToPreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1)
        }
    }, [currentQuestionIndex])

    const isFullscreen = useMemo(() => {
        if (!survey) return false

        const linkedValue = getSurveysLinkedValue(survey)

        return Boolean(linkedValue?.fullscreen)
    }, [survey])

    if (isFullscreen) {
        return (
            <SurveyFullscreenModal
                modalTitle={modalTitle}
                canGoBack={canGoBack}
                currentQuestion={currentQuestion}
                survey={survey}
                open={open}
                questionState={questionState}
                currentQuestionIndex={currentQuestionIndex}
                goToPreviousQuestion={goToPreviousQuestion}
                handleSubmit={handleSubmit}
                handleClose={handleClose}
                handleQuestionStateChange={handleQuestionStateChange}
            />
        )
    }

    return <DefaultSurveyModal
        modalTitle={modalTitle}
        canGoBack={canGoBack}
        currentQuestion={currentQuestion}
        survey={survey}
        open={open}
        questionState={questionState}
        currentQuestionIndex={currentQuestionIndex}
        goToPreviousQuestion={goToPreviousQuestion}
        handleSubmit={handleSubmit}
        handleClose={handleClose}
        handleQuestionStateChange={handleQuestionStateChange}
    />
}