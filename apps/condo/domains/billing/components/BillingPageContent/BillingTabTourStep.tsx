import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Tour } from '@open-condo/ui'
import { useBreakpoints } from '@open-condo/ui/hooks'

import { EXTENSION_TAB_KEY } from '@condo/domains/billing/constants/constants'


const STORAGE_PREFIX = 'billing-tab-tour-seen:'

type BillingTabTourStepInnerProps = {
    tabRect: DOMRect
    storageKey: string
    title: string
    message: string
}

const BillingTabTourStepInner: React.FC<BillingTabTourStepInnerProps> = ({ tabRect, storageKey, title, message }) => {
    const { setCurrentStep } = Tour.useTourContext()

    useEffect(() => {
        try { localStorage.setItem(storageKey, '1') } catch (e) { console.error(e) }
    }, [storageKey])

    useEffect(() => {
        const handleClick = () => setCurrentStep(-1)
        document.addEventListener('click', handleClick, true)
        return () => document.removeEventListener('click', handleClick, true)
    }, [setCurrentStep])

    const handleClose = useCallback(() => setCurrentStep(-1), [setCurrentStep])

    return (
        <Tour.TourStep
            step={0}
            title={title}
            message={message}
            onClose={handleClose}
            placement='bottom'
            getPopupContainer={() => document.body}
        >
            <span style={{
                position: 'fixed',
                top: tabRect.top,
                left: tabRect.left,
                width: tabRect.width,
                height: tabRect.height,
                pointerEvents: 'none',
                opacity: 0,
            }} />
        </Tour.TourStep>
    )
}

type BillingTabTourStepProps = {
    id: string
    tabsId: string
    title: string
    message: string
}

export const BillingTabTourStep: React.FC<BillingTabTourStepProps> = ({ id, tabsId, title, message }) => {
    const storageKey = `${STORAGE_PREFIX}${id}`
    const { TABLET_SMALL } = useBreakpoints()
    const tabKey = `${EXTENSION_TAB_KEY}-${id}`

    const show = useMemo(() => {
        try { return localStorage.getItem(storageKey) !== '1' } catch (e) { console.error(e); return false }
    }, [storageKey])

    const [tabRect, setTabRect] = useState<DOMRect | null>(null)

    useEffect(() => {
        if (!show || !TABLET_SMALL) return
        const btn = document.getElementById(`${tabsId}-tab-${tabKey}`)
        if (btn) setTabRect(btn.getBoundingClientRect())
    }, [show, TABLET_SMALL, tabsId, tabKey])

    if (!show || !TABLET_SMALL || !tabRect) return null

    return (
        <Tour.Provider>
            <BillingTabTourStepInner
                tabRect={tabRect}
                storageKey={storageKey}
                title={title}
                message={message}
            />
        </Tour.Provider>
    )
}
