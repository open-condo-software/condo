import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Space, Typography } from '@open-condo/ui'

import { Logo } from '@condo/domains/common/components/Logo'

import styles from './SurveyFullscreenModal.module.css'
import { ModalProps } from './SurveyModal'
import { SurveyQuestionContent } from './SurveyQuestionContent'


export const SurveyFullscreenModal: React.FC<ModalProps> = (props) => {
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
        handleQuestionStateChange,
    } = props

    if (!open) return null

    return (
        <div className={styles.surveyFullscreenOverlay}>
            <div className={styles.surveyFullscreenLogo}>
                <Logo/>
            </div>
            
            <Space size={40} width='auto' direction='vertical' className={styles.surveyFullscreenModal}>
                <Space size={24} direction='vertical'>
                    <Typography.Title level={2}>{modalTitle}</Typography.Title>

                    {survey && survey.questions.length > 1 && currentQuestionIndex !== 0 && (
                        <Typography.Paragraph type='secondary'>
                            {intl.formatMessage({ id: 'surveys.questionProgress' }, {
                                current: currentQuestionIndex + 1,
                                total: survey.questions.length,
                            })}
                        </Typography.Paragraph>
                    )}
                </Space>

                {currentQuestion && (
                    <SurveyQuestionContent
                        question={currentQuestion}
                        onStateChange={handleQuestionStateChange}
                    />
                )}

                <div className={styles.actionButtonWrapper}>
                    <ActionBar
                        actions={[
                            <>
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
                                    {currentQuestion?.buttonText}
                                </Button>
                            </>,
                        ]}
                    />
                </div>
            </Space>
        </div>
    )
}
