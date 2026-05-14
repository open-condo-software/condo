import React, { useEffect, useMemo, useState } from 'react'

import { Checkbox, Input, Markdown, Radio, Space } from '@open-condo/ui'

import type { SurveyQuestion } from 'posthog-js'

export type SurveyQuestionValue = string | string[] | number | null

export type SurveyQuestionState = {
    value: SurveyQuestionValue
    isValid: boolean
}

type QuestionRendererProps = {
    question: SurveyQuestion
    value: SurveyQuestionValue
    onChange: (value: SurveyQuestionValue) => void
}

type QuestionConfig = {
    getValue: (value: SurveyQuestionValue) => SurveyQuestionValue
    validate: (value: SurveyQuestionValue) => boolean
    render: (props: QuestionRendererProps) => React.ReactNode
}

const QUESTION_CONFIGS: Record<string, QuestionConfig> = {
    single_choice: {
        getValue: (v) => (typeof v === 'string' ? v : ''),
        validate: (v) => !!v,
        render: ({ question, value, onChange }) => (
            <Radio.Group value={value as string} onChange={(e) => onChange(e.target.value)}>
                <Space direction='vertical' size={20}>
                    {'choices' in question && question.choices?.map((choice) => (
                        <Radio key={choice} value={choice} label={choice} />
                    ))}
                </Space>
            </Radio.Group>
        ),
    },
    multiple_choice: {
        getValue: (v) => (Array.isArray(v) ? v : []),
        validate: (v) => Array.isArray(v) && v.length > 0,
        render: ({ question, value, onChange }) => {
            const currentValues = Array.isArray(value) ? value : []
            const handleChange = (choice: string, checked: boolean) => {
                if (checked) {
                    onChange([...currentValues, choice])
                } else {
                    onChange(currentValues.filter((v) => v !== choice))
                }
            }
            return (
                <Space direction='vertical' size={20}>
                    {'choices' in question && question.choices?.map((choice) => (
                        <Checkbox
                            key={choice}
                            checked={currentValues.includes(choice)}
                            onChange={(e) => handleChange(choice, e.target.checked)}
                        >
                            {choice}
                        </Checkbox>
                    ))}
                </Space>
            )
        },
    },
    open: {
        getValue: (v) => (typeof v === 'string' ? v : ''),
        validate: (v) => typeof v === 'string' && !!v.trim(),
        render: ({ value, onChange }) => (
            <Input.TextArea
                value={value as string}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
            />
        ),
    },
    rating: {
        getValue: (v) => (typeof v === 'number' ? v : null),
        validate: (v) => v !== null,
        render: ({ value, onChange }) => (
            <Radio.Group
                value={value?.toString()}
                onChange={(e) => onChange(Number(e.target.value))}
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
        ),
    },
    link: {
        getValue: () => 'link clicked',
        validate: () => true,
        render: () => null,
    },
}

type SurveyQuestionContentProps = {
    question: SurveyQuestion
    onStateChange?: (state: SurveyQuestionState) => void
}

export const SurveyQuestionContent: React.FC<SurveyQuestionContentProps> = ({ question, onStateChange }) => {
    const config = QUESTION_CONFIGS[question.type]
    const [value, setValue] = useState<SurveyQuestionValue>(config?.getValue(null) ?? null)

    useEffect(() => {
        setValue(config?.getValue(null) ?? null)
    }, [question.id, config])

    const isValid = useMemo(() => config?.validate(value) ?? false, [config, value])

    useEffect(() => {
        onStateChange?.({ value, isValid })
    }, [value, isValid, onStateChange])

    if (!config) return null

    return (
        <Space direction='vertical' size={24} width='100%'>
            {question.description && (
                <Markdown>
                    {question.description}
                </Markdown>
            )}
            {config.render({ question, value, onChange: setValue })}
        </Space>
    )
}

export const getSurveyQuestionValue = (question: SurveyQuestion, state: SurveyQuestionState): SurveyQuestionValue => {
    if (question.type === 'link' && question.link) {
        window.open(question.link, '_blank')
        return 'link clicked'
    }
    return state.value
}