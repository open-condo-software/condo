import { TextAreaRef } from 'antd/lib/input/TextArea'
import { FC, useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

import { CheckCircle, Close, RefreshCw, XCircle } from '@open-condo/icons'
import { Space, Tooltip, Typography, Button } from '@open-condo/ui'

import './AIInputNotification.css'

type Props = {
    targetRef: React.MutableRefObject<TextAreaRef>
    result: string
    onApply: () => void
    onUpdate: () => void
    onClose: () => void
    open: boolean
    children: React.ReactNode
    errorMessage?: string
}

const AUTO_CLOSE_DELAY = 10000

const AIInputNotification: FC<Props> = ({
    result,
    onApply,
    onUpdate,
    onClose,
    open,
    children,
    errorMessage,
}) => {
    const intl = useIntl()
    const ReadyLabel = intl.formatMessage({ id: 'ai.inputNotification.ready' })
    const FailedToGenerateLabel = intl.formatMessage({ id: 'ai.inputNotification.failedToGenerate' })
    const ApplyLabel = intl.formatMessage({ id: 'ai.inputNotification.apply' })
    const AnotherVariantLabel = intl.formatMessage({ id: 'ai.inputNotification.anotherVariant' })

    const targetRef = useRef(null)
    const autoCloseTimerRef = useRef<NodeJS.Timeout>()

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
            className='ai-notification-wrapper'
            overlayInnerStyle={{
                width: tooltipWidth,
                right: (tooltipWidth - 250) / 2,
                position: 'relative',
            }}
            open={open && (!!result || !!errorMessage)}
            title={
                <div
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <Space
                        size={8}
                        align='start'
                        direction='vertical'
                        className='ai-notification'
                    >
                        <div className='ai-notification-header'>
                            {!errorMessage ? (
                                <Typography.Text type='success'>
                                    <span className='ai-notification-status'>
                                        <CheckCircle size='medium'/>
                                        {ReadyLabel}
                                    </span>
                                </Typography.Text>
                            ) : (
                                <Typography.Text type='danger'>
                                    <span className='ai-notification-status'>
                                        <XCircle size='medium'/>
                                        {FailedToGenerateLabel}
                                    </span>
                                </Typography.Text>
                            )}

                            <Button
                                type='secondary'
                                minimal
                                compact
                                size='medium'
                                onClick={onClose}
                                icon={<Close size='small'/>}
                            />
                        </div>

                        <Typography.Paragraph>
                            {result || errorMessage}
                        </Typography.Paragraph>

                        {result && (
                            <div className='ai-notification-actions'>
                                <Button
                                    onClick={onApply}
                                    type='primary'
                                    minimal
                                    compact
                                    size='medium'
                                    className='ai-notification-apply-btn'
                                >
                                    {ApplyLabel}
                                </Button>

                                <Button
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
            <span ref={targetRef} className='ai-notification-trigger'>
                {children}
            </span>
        </Tooltip>
    )
}

export default AIInputNotification
