import React, { createContext, useState, useEffect, useContext } from 'react'

import { PostMessageController } from './controller'


type PostMessageContextType = Pick<PostMessageController, 'addFrame' | 'removeFrame' | 'addHandler'>

const PostMessageContext = createContext<PostMessageContextType>({
    addFrame: () => '',
    removeFrame: () => {},
    addHandler: () => {},
})

export const PostMessageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [controller] = useState(() => new PostMessageController())

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