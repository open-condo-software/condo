import React, { useCallback, useContext, useRef, useState } from 'react'

interface IFocusContext {
    isFocusVisible?: boolean
    showFocusTooltip?: () => void
}

const FocusContext = React.createContext<IFocusContext>({})

export const useFocusContext = () => useContext<IFocusContext>(FocusContext)

export const FocusContextProvider: React.FC = (props) => {
    const [isFocusVisible, setIsFocusVisible] = useState(false)
    const timeoutId = useRef(null)

    const showFocusTooltip = useCallback(() => {
        if (!isFocusVisible) {
            setIsFocusVisible(true)

            if (!timeoutId.current) {
                timeoutId.current = setTimeout(() => {
                    setIsFocusVisible(false)
                    timeoutId.current = null
                }, 8000)
            }
        }
    }, [])

    return (
        <FocusContext.Provider value={{
            isFocusVisible,
            showFocusTooltip,
        }}>
            {props.children}
        </FocusContext.Provider>
    )
}

