import React, { useCallback, useEffect } from 'react'

export const TelephonyContext = React.createContext({})

const CALL_EVENT = 'call'

export const TelephonyContextProvider = ({ children }) => {
    const handleMessage = useCallback(async (event: MessageEvent) => {
        if (typeof window === 'undefined') return null
        switch (event.data.type) {
            case CALL_EVENT:
                window.open(`/phone/+${event.data.phone}`, '_blank')
                break
        }
    }, [])

    useEffect(() => {
        window.addEventListener('message', handleMessage)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [handleMessage])

    return (
        <TelephonyContext.Provider value={{}}>
            {children}
        </TelephonyContext.Provider>
    )
}