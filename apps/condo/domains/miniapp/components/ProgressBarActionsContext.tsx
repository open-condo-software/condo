import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react'

import type { B2BAppFrameProps } from './B2BAppFrame'

type FrameRegistrationEvent = Parameters<NonNullable<B2BAppFrameProps['onRegister']>>[0]
type ProgressBarFrame = Pick<FrameRegistrationEvent, 'frameOrigin' | 'frameRef'>

type ProgressBarActionsContextValue = {
    registerProgressBarFrame: (barId: string, event: FrameRegistrationEvent) => () => void
    sendProgressBarAction: (barId: string, actionId: string) => void
}

const ProgressBarActionsContext = createContext<ProgressBarActionsContextValue | null>(null)

export const ProgressBarActionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const frames = useRef(new Map<string, ProgressBarFrame>())

    const registerProgressBarFrame = useCallback((barId: string, event: FrameRegistrationEvent) => {
        const frame = { frameOrigin: event.frameOrigin, frameRef: event.frameRef }
        frames.current.set(barId, frame)

        return () => {
            if (frames.current.get(barId) === frame) {
                frames.current.delete(barId)
            }
        }
    }, [])

    const sendProgressBarAction = useCallback((barId: string, actionId: string) => {
        const frame = frames.current.get(barId)
        frame?.frameRef.current?.contentWindow?.postMessage({
            type: 'CondoWebAppActionClickEvent',
            data: { actionId },
        }, frame.frameOrigin)
    }, [])

    const value = useMemo(() => ({ registerProgressBarFrame, sendProgressBarAction }), [registerProgressBarFrame, sendProgressBarAction])

    return <ProgressBarActionsContext.Provider value={value}>{children}</ProgressBarActionsContext.Provider>
}

export function useProgressBarActions () {
    const context = useContext(ProgressBarActionsContext)
    if (!context) {
        throw new Error('useProgressBarActions must be used within ProgressBarActionsProvider')
    }

    return context
}
