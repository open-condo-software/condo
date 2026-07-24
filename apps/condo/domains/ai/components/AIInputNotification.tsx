import { TextAreaRef } from 'antd/lib/input/TextArea'
import { FC, useEffect, useState } from 'react'

import { CheckCircle, Close, RefreshCw, XCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography, Button } from '@open-condo/ui'

import { ProgressLoader } from '@condo/domains/common/components/ProgressLoader'

import styles from './AIInputNotification.module.css'

type AIInputNotificationPropsType = {
    targetRef?: React.MutableRefObject<TextAreaRef>
    result: string
    onApply: () => void
    onUpdate: () => void
    onClose: () => void
    open: boolean
    children: React.ReactNode
    errorMessage?: string
    updateLoading?: boolean
    disableUpdateButton?: boolean
}

type StatusPropsType = {
    result?: string
    error?: string
    updateLoading?: boolean
}

const Status: FC<StatusPropsType> = ({ result, error, updateLoading }) => {
    const intl = useIntl()

    const ReadyLabel = intl.formatMessage({ id: 'ai.inputNotification.ready' })
    const FailedToGenerateLabel = intl.formatMessage({ id: 'ai.inputNotification.failedToGenerate' })

    if (!updateLoading && result) {
        return (
            <Typography.Text type='success'>
                <span className={styles.status}>
                    <CheckCircle size='medium'/>
                    {ReadyLabel}
                </span>
            </Typography.Text>
        )
    }

    if (!updateLoading && error) {
        return (
            <Typography.Text type='danger'>
                <span className={styles.status}>
                    <XCircle size='medium'/>
                    {FailedToGenerateLabel}
                </span>
            </Typography.Text>
        )
    }

    return <ProgressLoader/>
}

const AIInputNotification: FC<AIInputNotificationPropsType> = ({
    result,
    onApply,
    onUpdate,
    onClose,
    open,
    children,
    errorMessage,
    updateLoading,
    disableUpdateButton,
}) => {
    const intl = useIntl()
    const ApplyLabel = intl.formatMessage({ id: 'ai.inputNotification.apply' })
    const AnotherVariantLabel = intl.formatMessage({ id: 'ai.inputNotification.anotherVariant' })
    const [tempMessage, setTempMessage] = useState('')

    useEffect(() => {
        if (updateLoading && result) setTempMessage(result)
        if (!updateLoading && !result) setTempMessage('')
    }, [updateLoading, result])

    const resultForViewing = result || tempMessage
    const isVisible = open && (!!resultForViewing || !!errorMessage || updateLoading)

    return (
        <div className={styles.wrapper}>
            {isVisible && (
                // TODO (vtolmachev): keep panel inside viewport on small comment blocks
                // (absolute upward placement can clip the header; needs collision handling or overlay)
                <div className={styles.panel} role='status' aria-live='polite'>
                    <Space
                        size={12}
                        align='start'
                        direction='vertical'
                        className={styles.notification}
                    >
                        <div className={styles.header}>
                            <Status
                                result={resultForViewing}
                                error={errorMessage}
                                updateLoading={updateLoading}
                            />

                            <Button
                                aria-label='Close'
                                type='secondary'
                                minimal
                                compact
                                size='medium'
                                onClick={onClose}
                                icon={<Close size='small'/>}
                            />
                        </div>

                        <Typography.Paragraph size='medium'>
                            <span
                                className={styles.resultText}
                            >
                                {resultForViewing || errorMessage}
                            </span>
                        </Typography.Paragraph>

                        {(updateLoading || resultForViewing) && (
                            <div className={styles.actions}>
                                <Button
                                    onClick={onApply}
                                    type='primary'
                                    minimal
                                    compact
                                    disabled={updateLoading}
                                    size='medium'
                                >
                                    {ApplyLabel}
                                </Button>

                                <Button
                                    disabled={updateLoading || disableUpdateButton}
                                    onClick={onUpdate}
                                    type='secondary'
                                    minimal
                                    compact
                                    size='medium'
                                    icon={<RefreshCw size='small'/>}
                                >
                                    {AnotherVariantLabel}
                                </Button>
                            </div>
                        )}
                    </Space>
                </div>
            )}

            {children}
        </div>
    )
}

export default AIInputNotification
