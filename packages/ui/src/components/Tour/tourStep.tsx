import { Popover as DefaultPopover } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Close } from '@open-condo/icons'

import { useTourContext } from './tourContext'

import { sendAnalyticsChangeEvent, sendAnalyticsClickEvent } from '../_utils/analytics'
import { Typography } from '../Typography'

import type { PopoverProps as DefaultPopoverProps } from 'antd'


const TOUR_STEP_CLASS_PREFIX = 'condo-popover'

export type TourStepProps = Pick<DefaultPopoverProps,
| 'className'
| 'id'
| 'destroyTooltipOnHide'
| 'zIndex'> & {
    step: number
    title: string
    message: string
    onClose?: () => void
    children?: React.ReactNode
    placement?: 'top' | 'bottom' | 'left' | 'right'
}

export const TourStep: React.FC<TourStepProps> = (props) => {
    const {
        title,
        message,
        onClose,
        step,
        ...otherProps
    } = props

    const { currentStep } = useTourContext()

    const [open, setOpen] = useState<boolean>(step === currentStep)

    useEffect(() => {
        const isOpen = step === currentStep

        setOpen(isOpen)

        if (isOpen) {
            sendAnalyticsChangeEvent('TourStep', { title, message, step })
        }
    }, [currentStep, message, step, title])

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose()
        }

        setOpen(false)

        sendAnalyticsClickEvent('TourStep', { title, message, step })
    }, [message, onClose, step, title])

    const popoverTitle = useMemo(() => (
        <>
            <div className='condo-popover-icon-wrapper'>
                <Close size='small' onClick={handleClose} />
            </div>
            <Typography.Title level={4}>
                {title}
            </Typography.Title>
        </>
    ), [handleClose, title])

    const popoverContent = useMemo(() => (
        <Typography.Text size='small'>
            {message}
        </Typography.Text>
    ), [message])
    
    return (
        <DefaultPopover
            {...otherProps}
            title={popoverTitle}
            content={popoverContent}
            open={open}
            showArrow
            arrowPointAtCenter
            prefixCls={TOUR_STEP_CLASS_PREFIX}
            trigger={[]}
        />
    )
}