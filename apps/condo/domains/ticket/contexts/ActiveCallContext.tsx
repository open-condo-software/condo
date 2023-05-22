import isUndefined from 'lodash/isUndefined'
import { createContext, useContext, useEffect, useState } from 'react'

import { usePostMessageContext } from '@condo/domains/common/components/PostMessageProvider'

interface IActiveCallContext {
    isCallActive: boolean
    connectedTickets: string[]
}

const ActiveCallContext = createContext<IActiveCallContext>({
    isCallActive: false,
    connectedTickets: [],
})

const useActiveCall = (): IActiveCallContext => useContext(ActiveCallContext)

const ActiveCallContextProvider = ({ children = {} }) => {
    const { addEventHandler } = usePostMessageContext()

    const [isCallActive, setIsCallActive] = useState(false)
    const [connectedTickets, setConnectedTickets] = useState([])

    useEffect(() => {
        if (!isUndefined(window)) {
            addEventHandler('CondoWebSetActiveCall', '*', ({ isCallActive, connectedTickets }) => {
                setIsCallActive(isCallActive)
                setConnectedTickets(connectedTickets)

                return { sent: true }
            })
        }
    }, [addEventHandler])

    return (
        <ActiveCallContext.Provider
            value={{
                isCallActive,
                connectedTickets,
            }}
        >
            {children}
        </ActiveCallContext.Provider>
    )
}

export { useActiveCall, ActiveCallContextProvider }