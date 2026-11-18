import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import type { IncomingEventData } from '@open-condo/bridge'

import type { B2BAppFrameProps } from './B2BAppFrame'

type FrameRegistrationEvent = Parameters<NonNullable<B2BAppFrameProps['onRegister']>>[0]
type ProgressBarFrame = Pick<FrameRegistrationEvent, 'frameOrigin' | 'frameRef'>

type ProgressBarActionsContextValue = {
    registerProgressBarFrame: (barId: string, event: FrameRegistrationEvent) => () => void
    sendProgressBarAction: (barId: string, actionId: string) => void
    sendProgressBarCancel: (barId: string) => void
}

const ProgressBarActionsContext = createContext<ProgressBarActionsContextValue | null>(null)

export const ProgressBarActionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [frames, setFrames] = useState<Map<string, ProgressBarFrame>>(() => new Map())

    const registerProgressBarFrame = useCallback((barId: string, event: FrameRegistrationEvent) => {
        const frame = { frameOrigin: event.frameOrigin, frameRef: event.frameRef }
        setFrames((previousFrames) => new Map(previousFrames).set(barId, frame))

        return () => {
            setFrames((previousFrames) => {
                if (previousFrames.get(barId) !== frame) return previousFrames

                const nextFrames = new Map(previousFrames)
                nextFrames.delete(barId)
                return nextFrames
            })
        }
    }, [])

    const sendProgressBarAction = useCallback((barId: string, actionId: string) => {
        const frame = frames.get(barId)
        frame?.frameRef.current?.contentWindow?.postMessage({
            type: 'CondoWebAppActionClickEvent',
            data: { actionId },
        }, frame.frameOrigin)
    }, [frames])

    const sendProgressBarCancel = useCallback((barId: string) => {
        const frame = frames.get(barId)
        const data: IncomingEventData<'CondoWebAppProgressBarCancel'> = {}
        frame?.frameRef.current?.contentWindow?.postMessage({
            type: 'CondoWebAppProgressBarCancelEvent',
            data,
        }, frame.frameOrigin)
    }, [frames])

    const value = useMemo(() => ({ registerProgressBarFrame, sendProgressBarAction, sendProgressBarCancel }), [registerProgressBarFrame, sendProgressBarAction, sendProgressBarCancel])

    return <ProgressBarActionsContext.Provider value={value}>{children}</ProgressBarActionsContext.Provider>
}

export function useProgressBarActions () {
    const context = useContext(ProgressBarActionsContext)
    if (!context) {
        throw new Error('useProgressBarActions must be used within ProgressBarActionsProvider')
    }

    return context
}
