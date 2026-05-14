import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Space, Typography } from '@open-condo/ui'

import { ModalProps } from './SurveyModal'
import { SurveyQuestionContent } from './SurveyQuestionContent'

export const DefaultSurveyModal: React.FC<ModalProps> = (props) => {
    const intl = useIntl()
    const BackButtonLabel = intl.formatMessage({ id: 'surveys.button.back' })

    const {
        modalTitle,
        canGoBack,
        currentQuestion,
        survey,
        questionState,
        open,
        currentQuestionIndex,
        goToPreviousQuestion,
        handleSubmit,
        handleClose,
        handleQuestionStateChange,
    } = props

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
