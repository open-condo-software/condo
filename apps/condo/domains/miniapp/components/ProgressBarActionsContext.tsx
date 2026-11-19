import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react'

import type { IncomingEventData } from '@open-condo/bridge'

import type { B2BAppFrameProps } from './B2BAppFrame'

type FrameRegistrationEvent = Parameters<NonNullable<B2BAppFrameProps['onRegister']>>[0]
type ProgressBarFrame = Pick<FrameRegistrationEvent, 'frameOrigin' | 'frameRef'>

type ProgressBarActionsContextValue = {
    registerProgressBarFrame: (barId: string, event: FrameRegistrationEvent) => () => void
    sendProgressBarAction: (barId: string, actionId: string) => void
    sendTaskCancel: (taskId: string, externalTaskId?: string) => void
}

const ProgressBarActionsContext = createContext<ProgressBarActionsContextValue | null>(null)

export const ProgressBarActionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const framesRef = useRef<Map<string, ProgressBarFrame>>(new Map())

    const registerProgressBarFrame = useCallback((barId: string, event: FrameRegistrationEvent) => {
        const frame = { frameOrigin: event.frameOrigin, frameRef: event.frameRef }
        framesRef.current.set(barId, frame)

        return () => {
            if (framesRef.current.get(barId) !== frame) return

            framesRef.current.delete(barId)
        }
    }, [])

    const sendProgressBarAction = useCallback((barId: string, actionId: string) => {
        const frame = framesRef.current.get(barId)
        const targetWindow = frame?.frameRef.current?.contentWindow
        if (!frame || !targetWindow) return

        targetWindow.postMessage({
            type: 'CondoWebAppActionClickEvent',
            data: { actionId },
        }, frame.frameOrigin)
    }, [])

    const sendTaskCancel = useCallback((taskId: string, externalTaskId?: string) => {
        const frame = framesRef.current.get(taskId)
        const data: IncomingEventData<'CondoWebAppTaskCancel'> = {
            taskId,
            ...(externalTaskId !== undefined ? { externalTaskId } : {}),
        }
        frame?.frameRef.current?.contentWindow?.postMessage({
            type: 'CondoWebAppTaskCancelEvent',
            data,
        }, frame.frameOrigin)
    }, [])

    const value = useMemo(() => ({ registerProgressBarFrame, sendProgressBarAction, sendTaskCancel }), [registerProgressBarFrame, sendProgressBarAction, sendTaskCancel])

    return <ProgressBarActionsContext.Provider value={value}>{children}</ProgressBarActionsContext.Provider>
}

export function useProgressBarActions () {
    const context = useContext(ProgressBarActionsContext)
    if (!context) {
        throw new Error('useProgressBarActions must be used within ProgressBarActionsProvider')
    }

    return context
}
