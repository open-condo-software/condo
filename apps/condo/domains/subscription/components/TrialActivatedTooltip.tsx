import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tour } from '@open-condo/ui'

export interface TrialActivatedTooltipProps {
    children: React.ReactElement
    placement?: 'top' | 'bottom' | 'left' | 'right'
    planName: string
    onClose?: () => void
    getPopupContainer?: () => HTMLElement
}

export const TrialActivatedTooltip: React.FC<TrialActivatedTooltipProps> = ({ 
    children, 
    placement = 'right', 
    planName,
    onClose,
    getPopupContainer,
}) => {
    const intl = useIntl()

    const WelcomeTitle = intl.formatMessage({ 
        id: 'subscription.trial.welcome.title',
    }, { planName })
    
    const WelcomeDescription = intl.formatMessage({
        id: 'subscription.trial.welcome.description',
    }, { planName })

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose()
        }
    }, [onClose])

    return (
        <Tour.TourStep
            step={0}
            title={WelcomeTitle}
            message={WelcomeDescription}
            placement={placement}
            onClose={handleClose}
            getPopupContainer={getPopupContainer}
        >
            {children}
        </Tour.TourStep>
    )
}
