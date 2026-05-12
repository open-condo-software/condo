import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Checkbox, Input, Markdown, Radio, Space } from '@open-condo/ui'

import type { SurveyQuestion } from 'posthog-js'

export type SurveyQuestionValue = string | string[] | number | null

export type SurveyQuestionState = {
    value: SurveyQuestionValue
    isValid: boolean
}

type SurveyQuestionContentProps = {
    question: SurveyQuestion
    onStateChange?: (state: SurveyQuestionState) => void
}

export const SurveyQuestionContent: React.FC<SurveyQuestionContentProps> = ({ question, onStateChange }) => {
    const [singleChoiceValue, setSingleChoiceValue] = useState<string>('')
    const [multipleChoiceValues, setMultipleChoiceValues] = useState<string[]>([])
    const [openTextValue, setOpenTextValue] = useState<string>('')
    const [ratingValue, setRatingValue] = useState<number | null>(null)

    const currentValue = useMemo<SurveyQuestionValue>(() => {
        switch (question.type) {
            case 'single_choice':
                return singleChoiceValue
            case 'multiple_choice':
                return multipleChoiceValues
            case 'open':
                return openTextValue
            case 'rating':
                return ratingValue
            case 'link':
                return 'link clicked'
            default:
                return null
        }
    }, [question.type, singleChoiceValue, multipleChoiceValues, openTextValue, ratingValue])

    const isValid = useMemo(() => {
        switch (question.type) {
            case 'single_choice':
                return !!singleChoiceValue
            case 'multiple_choice':
                return multipleChoiceValues.length > 0
            case 'open':
                return !!openTextValue.trim()
            case 'rating':
                return ratingValue !== null
            case 'link':
                return true
            default:
                return false
        }
    }, [question.type, singleChoiceValue, multipleChoiceValues, openTextValue, ratingValue])

    useEffect(() => {
        if (onStateChange) {
            onStateChange({ value: currentValue, isValid })
        }
    }, [currentValue, isValid, onStateChange])

    const setCheckBoxValue = useCallback((e, choice)=> {
        if (e.target.checked) {
            setMultipleChoiceValues([...multipleChoiceValues, choice])
        } else {
            setMultipleChoiceValues(multipleChoiceValues.filter((v) => v !== choice))
        }
    }, [multipleChoiceValues])

    const questionContent = useMemo(() => {
        switch (question.type) {
            case 'single_choice':
                return (
                    <Radio.Group
                        value={singleChoiceValue}
                        onChange={(e) => setSingleChoiceValue(e.target.value)}
                    >
                        <Space direction='vertical' size={20}>
                            {'choices' in question && question.choices?.map((choice) => (
                                <Radio key={choice} value={choice} label={choice} />
                            ))}
                        </Space>
                    </Radio.Group>
                )
            case 'multiple_choice':
                return (
                    <Space direction='vertical' size={20}>
                        {'choices' in question && question.choices?.map((choice) => (
                            <Checkbox
                                key={choice}
                                checked={multipleChoiceValues.includes(choice)}
                                onChange={e => setCheckBoxValue(e, choice)}
                            >
                                {choice}
                            </Checkbox>
                        ))}
                    </Space>
                )
            case 'open':
                return (
                    <Input.TextArea
                        value={openTextValue}
                        onChange={(e) => setOpenTextValue(e.target.value)}
                        rows={4}
                    />
                )
            case 'rating':
                return (
                    <Radio.Group
                        value={ratingValue?.toString()}
                        onChange={(e) => setRatingValue(Number(e.target.value))}
                    >
                        <Space direction='horizontal' size={12}>
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <Radio
                                    key={rating}
                                    value={rating.toString()}
                                    label={rating.toString()}
                                />
                            ))}
                        </Space>
                    </Radio.Group>
                )
            default:
                return null
        }
    }, [question, singleChoiceValue, openTextValue, ratingValue, multipleChoiceValues, setCheckBoxValue])

    return (
        <Space direction='vertical' size={24} width='100%'>
            {question.description && (
                <Markdown>
                    {question.description}
                </Markdown>
            )}
            {questionContent}
        </Space>
    )
}

export const getSurveyQuestionValue = (question: SurveyQuestion, state: SurveyQuestionState): string | string[] | number => {
    if (question.type === 'link') {
        if (question.link) {
            window.open(question.link, '_blank')
        }
        return 'link clicked'
    }
    return state.value as string | string[] | number
}
