import React, { createContext, useState, useEffect, useContext, useMemo } from 'react'

import { PostMessageController } from './controller'

import type { RegisterBridgeEventsOptions } from './events/bridge'
import type { ControllerState } from './types'

// NOTE: Magic hook to make framework-agnostic controller reactive and observable
function useControllerState (controller: PostMessageController): ControllerState {
    const [controllerState, setControllerState] = useState(controller.state)

    useEffect(() => {
        const handleBridgeReadyChange = (event: CustomEvent) => {
            setControllerState(event.detail)
        }

        controller.addEventListener('statechange', handleBridgeReadyChange as EventListener)
        return () => {
            controller.removeEventListener('statechange', handleBridgeReadyChange as EventListener)
        }
    }, [controller])

    return controllerState
}

type PostMessageContextType = Pick<PostMessageController, 'addFrame' | 'removeFrame' | 'addHandler'> & ControllerState

const PostMessageContext = createContext<PostMessageContextType>({
    addFrame: () => '',
    removeFrame: () => {},
    addHandler: () => {},
    isBridgeReady: false,
})

type PostMessageProviderProps = Partial<Omit<RegisterBridgeEventsOptions, 'addHandler'>>

export const PostMessageProvider: React.FC<React.PropsWithChildren<PostMessageProviderProps>> = ({ children, router, notificationsApi, modalsApi }) => {
    const [controller] = useState(() => new PostMessageController())
    const controllerState = useControllerState(controller)

    useEffect( () => {
        controller.registerBridgeEvents({ router, notificationsApi, modalsApi })
    }, [controller, modalsApi, notificationsApi, router])

    useEffect(() => {
        window.addEventListener('message', controller.eventListener)
        return () => {
            window.removeEventListener('message', controller.eventListener)
        }
    }, [controller.eventListener])

    const contextValue: PostMessageContextType = useMemo(() => ({
        ...controllerState,
        addFrame: controller.addFrame,
        removeFrame: controller.removeFrame,
        addHandler: controller.addHandler,
    }), [controller, controllerState])

    return (
        <PostMessageContext.Provider value={contextValue}>
            {children}
        </PostMessageContext.Provider>
    )
}

export function usePostMessageContext (): PostMessageContextType {
    return useContext(PostMessageContext)
}