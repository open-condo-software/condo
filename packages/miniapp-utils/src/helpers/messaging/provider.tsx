import React, { createContext, useState, useEffect, useContext } from 'react'

import { PostMessageController } from './controller'

import type { RegisterBridgeEventsOptions } from './events/bridge'


type PostMessageContextType = Pick<PostMessageController, 'addFrame' | 'removeFrame' | 'addHandler'>

const PostMessageContext = createContext<PostMessageContextType>({
    addFrame: () => '',
    removeFrame: () => {},
    addHandler: () => {},
})

type PostMessageProviderProps = Partial<Omit<RegisterBridgeEventsOptions, 'addHandler'>>

export const PostMessageProvider: React.FC<React.PropsWithChildren<PostMessageProviderProps>> = ({ children, router, notificationsApi, modalsApi }) => {
    const [controller] = useState(() => new PostMessageController())

    useEffect(() => {
        controller.registerBridgeEvents({ router, notificationsApi, modalsApi })
    }, [controller, modalsApi, notificationsApi, router])

    useEffect(() => {
        window.addEventListener('message', controller.eventListener)
        return () => {
            window.removeEventListener('message', controller.eventListener)
        }
    }, [controller.eventListener])

    return (
        <PostMessageContext.Provider value={controller}>
            {children}
        </PostMessageContext.Provider>
    )
}

export function usePostMessageContext (): PostMessageContextType {
    return useContext(PostMessageContext)
}