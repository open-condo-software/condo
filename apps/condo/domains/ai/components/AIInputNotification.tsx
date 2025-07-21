import { TextAreaRef } from 'antd/lib/input/TextArea'
import { FC, useEffect, useRef, useState } from 'react'

import { CheckCircle, Close, RefreshCw, XCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Tooltip, Typography, Button } from '@open-condo/ui'

import { ProgressLoader } from '@condo/domains/common/components/ProgressLoader'

import styles from './AIInputNotification.module.css'

type AIInputNotificationPropsType = {
    targetRef: React.MutableRefObject<TextAreaRef>
    result: string
    onApply: () => void
    onUpdate: () => void
    onClose: () => void
    open: boolean
    children: React.ReactNode
    errorMessage?: string
    updateLoading?: boolean
}

const AUTO_CLOSE_DELAY = 15 * 1000

type StatusPropsType = {
    result?: string
    updateLoading?: boolean
}

const Status: FC<StatusPropsType> = ({ result, updateLoading }) => {
    const intl = useIntl()

    const ReadyLabel = intl.formatMessage({ id: 'ai.inputNotification.ready' })
    const FailedToGenerateLabel = intl.formatMessage({ id: 'ai.inputNotification.failedToGenerate' })

    if (result) return (
        <Typography.Text type='success'>
            <span className={styles.status}>
                <CheckCircle size='medium'/>
                {ReadyLabel}
            </span>
        </Typography.Text>
    )
    else if (updateLoading) return (
        <ProgressLoader/>
    )
    else return (
        <Typography.Text type='danger'>
            <span className={styles.status}>
                <XCircle size='medium'/>
                {FailedToGenerateLabel}
            </span>
        </Typography.Text>
    )
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
    const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout>>()

    const [tooltipWidth, setTooltipWidth] = useState(0)

    useEffect(() => {
        if (!targetRef.current) return
        const { width } = targetRef.current.getBoundingClientRect()
        setTooltipWidth(width)
    }, [])

    const startAutoCloseTimer = () => {
        clearAutoCloseTimer()
        autoCloseTimerRef.current = setTimeout(() => {
            onClose()
        }, AUTO_CLOSE_DELAY)
    }

    const clearAutoCloseTimer = () => {
        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current)
            autoCloseTimerRef.current = undefined
        }
    }

    const handleMouseEnter = () => {
        clearAutoCloseTimer()
    }

    const handleMouseLeave = () => {
        if (open) {
            startAutoCloseTimer()
        }
    }

    return (
        <Tooltip
            placement='top'
            mouseEnterDelay={1.5}
            className={styles.wrapper}
            overlayInnerStyle={{
                width: tooltipWidth,
                right: (tooltipWidth - 250) / 2,
                position: 'relative',
            }}
            open={open && (!!result || !!errorMessage || updateLoading)}
            title={
                <div
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <Space
                        size={12}
                        align='start'
                        direction='vertical'
                        className={styles.notification}
                    >
                        <div className={styles.header}>
                            <Status
                                result={result}
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
                                {result || errorMessage || tempMessage}
                            </span>
                        </Typography.Paragraph>

                        {(updateLoading || result) && (
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
                                    disabled={updateLoading}
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
            }
        >
            <span ref={targetRef}>
                {children}
            </span>
        </Tooltip>
    )
}

export default AIInputNotification