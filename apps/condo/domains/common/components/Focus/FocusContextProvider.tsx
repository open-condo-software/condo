import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'

interface IFocusContext {
    isFocusVisible?: boolean
    showFocusTooltip?: () => void
}

const FocusContext = React.createContext<IFocusContext>({})

export const useFocusContext = () => useContext<IFocusContext>(FocusContext)

const DEFAULT_FOCUS_TIMEOUT = 8000

export const FocusContextProvider: React.FC = (props) => {
    const router = useRouter()
    const [isFocusVisible, setIsFocusVisible] = useState(false)
    const timeoutId = useRef(null)

    useEffect(() => {
        if (router.events) {
            router.events.on('routeChangeStart', () => {
                setIsFocusVisible(false)
                timeoutId.current = null
            })
        }
    }, [router.events])

    const showFocusTooltip = useCallback(() => {
        if (!isFocusVisible) {
            setIsFocusVisible(true)

            if (!timeoutId.current) {
                timeoutId.current = setTimeout(() => {
                    setIsFocusVisible(false)
                    timeoutId.current = null
                }, DEFAULT_FOCUS_TIMEOUT)
            }
        }
    }, [])

    return (
        <FocusContext.Provider
            value={{
                isFocusVisible,
                showFocusTooltip,
            }}
        >
            {props.children}
        </FocusContext.Provider>
    )
}
