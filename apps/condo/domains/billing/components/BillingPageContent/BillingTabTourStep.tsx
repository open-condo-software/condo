import React, { useCallback, useMemo } from 'react'

import { Tour } from '@open-condo/ui'


const STORAGE_PREFIX = 'billing-tab-tour-seen:'

type BillingTabTourStepInnerProps = {
    storageKey: string
    title: string
    message: string
    children: React.ReactNode
}

const BillingTabTourStepInner: React.FC<BillingTabTourStepInnerProps> = ({ storageKey, title, message, children }) => {
    const { setCurrentStep } = Tour.useTourContext()

    const handleClose = useCallback(() => {
        try { localStorage.setItem(storageKey, '1') } catch (e) { console.error(e) }
        setCurrentStep(-1)
    }, [storageKey, setCurrentStep])

    return (
        <Tour.TourStep step={0} title={title} message={message} onClose={handleClose} placement='bottom'>
            {children}
        </Tour.TourStep>
    )
}

type BillingTabTourStepProps = {
    id: string
    title: string
    message: string
    children: React.ReactNode
}

export const BillingTabTourStep: React.FC<BillingTabTourStepProps> = ({ id, title, message, children }) => {
    const storageKey = `${STORAGE_PREFIX}${id}`

    const show = useMemo(() => {
        try { return localStorage.getItem(storageKey) !== '1' } catch (e) { console.error(e); return false }
    }, [storageKey])

    if (!show) return <>{children}</>

    return (
        <Tour.Provider>
            <BillingTabTourStepInner storageKey={storageKey} title={title} message={message}>
                {children}
            </BillingTabTourStepInner>
        </Tour.Provider>
    )
}
