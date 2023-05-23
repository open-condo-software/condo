import isUndefined from 'lodash/isUndefined'
import { createContext, useContext, useEffect, useState } from 'react'

import { usePostMessageContext } from '../../common/components/PostMessageProvider'

interface IActiveCallContext {
    isCallActive: boolean
}

const ActiveCallContext = createContext<IActiveCallContext>({
    isCallActive: false,
})

const useActiveCall = (): IActiveCallContext => useContext(ActiveCallContext)

const ActiveCallContextProvider = ({ children = {} }) => {
    const { addEventHandler } = usePostMessageContext()

    const [isCallActive, setIsCallActive] = useState(false)

    useEffect(() => {
        if (!isUndefined(window)) {
            addEventHandler('CondoWebSetActiveCall', '*', ({ isActiveCall }) => {
                setIsCallActive(isActiveCall)
            })
        }
    }, [addEventHandler])

    return (
        <ActiveCallContext.Provider
            value={{
                isCallActive,
            }}
        >
            {children}
        </ActiveCallContext.Provider>
    )
}

export { useActiveCall, ActiveCallContextProvider }