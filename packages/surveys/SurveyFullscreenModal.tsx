import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ActionBar, Button, Space, Typography } from '@open-condo/ui'

import { getSurveyQuestionValue, SurveyQuestionContent } from './SurveyQuestionContent'
import { useSurveys } from './SurveysContext'

import type { SurveyQuestionState } from './SurveyQuestionContent'
import type { SurveyResponse } from './SurveysContext'
import type { Survey } from 'posthog-js'

import './SurveyFullscreenModal.css'

type PostHogSurveyFullscreenModalProps = {
    surveyId: string
    open: boolean
    onClose: () => void
    extraEventData?: Record<string, unknown>
    logo?: React.ReactNode
}

export const SurveyFullscreenModal: React.FC<PostHogSurveyFullscreenModalProps> = ({
    surveyId,
    open,
    onClose,
    extraEventData = {},
    logo,
}) => {
    const {
        isReady,
        getSurveyById,
        captureSurveyShown,
        captureSurveySent,
        captureSurveyDismissed,
    } = useSurveys()

    const [survey, setSurvey] = useState<Survey | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [responses, setResponses] = useState<SurveyResponse[]>([])
    const [surveyShownEventSent, setSurveyShownEventSent] = useState(false)
    const [questionState, setQuestionState] = useState<SurveyQuestionState>({ value: null, isValid: false })

    useEffect(() => {
        if (!isReady || !open || !surveyId) return

        getSurveyById(surveyId, (foundSurvey) => {
            setSurvey(foundSurvey)
        })
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
            const newResponses = existingIndex >= 0
                ? prev.map((r, i) => i === existingIndex ? { questionId, value } : r)
                : [...prev, { questionId, value }]

            return newResponses
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

    if (!open) return null

    return (
        <div className='posthog-survey-fullscreen-overlay'>
            {logo && (
                <div className='posthog-survey-fullscreen-logo'>
                    {logo}
                </div>
            )}
            <Space size={40} width='auto' direction='vertical' className='posthog-survey-fullscreen-modal'>
                <Space size={24} direction='vertical'>
                    <Typography.Title level={2}>{modalTitle}</Typography.Title>

                    {survey && survey.questions.length > 1 && currentQuestionIndex !== 0 && (
                        <Typography.Paragraph type='secondary'>
                            Вопрос {currentQuestionIndex + 1} из {survey.questions.length}
                        </Typography.Paragraph>
                    )}
                </Space>

                {currentQuestion && (
                    <SurveyQuestionContent
                        question={currentQuestion}
                        onStateChange={handleQuestionStateChange}
                    />
                )}

                <div style={{ width: '100%' }}>
                    <ActionBar
                        actions={[
                            <>
                                {canGoBack && (
                                    <Button
                                        type='secondary'
                                        onClick={goToPreviousQuestion}
                                    >
                                        Назад
                                    </Button>
                                )}
                                <Button
                                    type='primary'
                                    onClick={handleSubmit}
                                    disabled={!questionState.isValid}
                                >
                                    {currentQuestion?.buttonText || 'Отправить'}
                                </Button>
                            </>,
                        ]}
                    />
                </div>
            </Space>
        </div>
    )
}
