import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import  { type SurveyResponse, useSurveys } from '@open-condo/surveys'
import { Button, Modal, Space, Typography } from '@open-condo/ui'

import { getSurveyQuestionValue, SurveyQuestionContent } from './SurveyQuestionContent'
import { useSurveyEvents } from './useSurveyEvents'

import type { SurveyQuestionState } from './SurveyQuestionContent'
import type { Survey } from 'posthog-js'

type PostHogSurveyModalProps = {
    surveyId: string
    open: boolean
    onClose: () => void
    extraEventData?: Record<string, unknown>
}

export const SurveyModal: React.FC<PostHogSurveyModalProps> = ({
    surveyId,
    open,
    onClose,
    extraEventData = {},
}) => {
    const intl = useIntl()
    const BackButtonLabel = intl.formatMessage({ id: 'surveys.button.back' })
    const {
        isReady,
        getSurveyById,
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

        const survey = getSurveyById(surveyId)

        setSurvey(survey)
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
        handleClose()
    }, [survey, responses, captureSurveySent, extraEventData, handleClose])

    const handleQuestionStateChange = useCallback((state: SurveyQuestionState) => {
        setQuestionState(state)
    }, [])

    const goToNextQuestion = useCallback(() => {
        if (!survey) return

        const currentQuestion = survey.questions[currentQuestionIndex]
        const currentResponse = responses.find((r) => r.questionId === currentQuestion.id)

        if (currentQuestion.branching?.type === 'response_based' && currentResponse) {
            const responseValues = currentQuestion.branching.responseValues
            if (responseValues && 'choices' in currentQuestion && currentQuestion.choices) {
                const choiceIndex = currentQuestion.choices.indexOf(currentResponse.value as string)
                if (choiceIndex !== undefined && choiceIndex >= 0) {
                    const nextQuestionIndex = responseValues[choiceIndex]
                    if (nextQuestionIndex !== undefined) {
                        setCurrentQuestionIndex(nextQuestionIndex)
                        return
                    }
                }
            }
        }

        handleQuestionStateChange({ isValid: false, value: null })
        if (currentQuestion.branching?.type === 'end') {
            completeSurvey()
            return
        }

        if (currentQuestionIndex < survey.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
            completeSurvey()
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

        setResponses((prev) => {
            const existingIndex = prev.findIndex((r) => r.questionId === questionId)
            return existingIndex >= 0
                ? prev.map((r, i) => i === existingIndex ? { questionId, value } : r)
                : [...prev, { questionId, value }]
        })

        goToNextQuestion()
    }, [survey, currentQuestion, questionState, goToNextQuestion])

    const modalTitle = useMemo(() => {
        return currentQuestion?.question || ''
    }, [currentQuestion])

    const canGoBack = currentQuestionIndex > 0

    const goToPreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1)
        }
    }, [currentQuestionIndex])

    const footer = useMemo(() => {
        if (!currentQuestion) return null

        return (
            <Space size={12}>
                {canGoBack && (
                    <Button
                        type='secondary'
                        onClick={goToPreviousQuestion}
                    >
                        {BackButtonLabel}
                    </Button>
                )}
                <Button
                    type='primary'
                    onClick={handleSubmit}
                    disabled={!questionState.isValid}
                >
                    {currentQuestion.buttonText}
                </Button>
            </Space>
        )
    }, [currentQuestion, canGoBack, goToPreviousQuestion, handleSubmit, questionState.isValid, BackButtonLabel])

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            title={modalTitle}
            width='small'
            destroyOnClose
            footer={footer}
        >
            {survey && survey.questions.length > 1 && currentQuestionIndex !== 0 && (
                <Typography.Paragraph type='secondary'>
                    {intl.formatMessage({ id: 'surveys.questionProgress' }, {
                        current: currentQuestionIndex + 1,
                        total: survey.questions.length,
                    })}
                </Typography.Paragraph>
            )}

            {currentQuestion && (
                <SurveyQuestionContent
                    question={currentQuestion}
                    onStateChange={handleQuestionStateChange}
                />
            )}
        </Modal>
    )
}