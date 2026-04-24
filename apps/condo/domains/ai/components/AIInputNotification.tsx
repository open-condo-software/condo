import { TextAreaRef } from 'antd/lib/input/TextArea'
import { FC, useEffect, useRef, useState } from 'react'

import { CheckCircle, Close, RefreshCw, XCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Tooltip, Typography, Button } from '@open-condo/ui'

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

    const targetRef = useRef(null)

    const [tooltipWidth, setTooltipWidth] = useState(0)

    useEffect(() => {
        if (!targetRef.current) return

        const observer = new ResizeObserver((entries) => {
            const { width } = entries[0].contentRect
            setTooltipWidth(width)
        })

        observer.observe(targetRef.current)
        return () => observer.disconnect()
    }, [])

    const resultForViewing = result || tempMessage

    return (
        <Tooltip
            placement='top'
            mouseEnterDelay={1.5}
            className={styles.wrapper}
            // NOTE: Tooltip by default has z-index = 1070. In /news/create page, we have dropdown menu with z-index = 1050.
            // Dropdown menu should be above on tooltip, therefore we set z-index = 1049
            zIndex={1049}
            overlayInnerStyle={{
                width: tooltipWidth,
                right: (tooltipWidth - 250) / 2,
                position: 'relative',
                top: '16px',
            }}
            open={open && (!!resultForViewing || !!errorMessage || updateLoading)}
            title={
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
                            type='secondary'
                            minimal
                            compact
                            size='medium'
                            onClick={onClose}
                            icon={<Close size='small'/>}
                        />
                    </div>

                    <Typography.Paragraph size='medium'>
                        <span className={updateLoading ? styles.smoothBlinkingText : ''}>
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
            }
        >
            <span ref={targetRef}>
                {children}
            </span>
        </Tooltip>
    )
}

export default AIInputNotification