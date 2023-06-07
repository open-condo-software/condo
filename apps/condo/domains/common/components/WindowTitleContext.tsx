import isNull from 'lodash/isNull'
import React, { useEffect, createContext, useContext, useState, useRef } from 'react'

interface IWindowTitleContext {
    setNewTitle: React.Dispatch<React.SetStateAction<string | null>>
}
const TITLE_BLINK_INTERVAL = 3000

const WindowTitleContext = createContext<IWindowTitleContext>({ setNewTitle: () => null })

export const useWindowTitleContext = (): IWindowTitleContext => useContext(WindowTitleContext)

export const WindowTitleContextProvider: React.FC = ({ children }) => {
    const [newTitle, setNewTitle] = useState<string | null>(null)
    const intervalRef = useRef(null)
    const originalTitle = useRef(null)

    useEffect(() => {
        const onFocus = () => {
            if (!isNull(newTitle)) {
                clearInterval(intervalRef.current)
                document.title = originalTitle.current

                intervalRef.current = null
                setNewTitle(null)
            }
        }

        if (typeof window !== 'undefined' && !isNull(newTitle)) {
            originalTitle.current = document.title

            if (document.hasFocus()) {
                setTimeout(() => {
                    document.title = originalTitle.current
                    setNewTitle(null)
                }, TITLE_BLINK_INTERVAL)
            } else {
                intervalRef.current = setInterval(() => {
                    document.title = document.title !== originalTitle.current ? originalTitle.current : newTitle
                }, TITLE_BLINK_INTERVAL)

                window.addEventListener('focus', onFocus)
            }
        }

        return () => {
            window.removeEventListener('focus', onFocus)
        }
    }, [newTitle])

    return (
        <WindowTitleContext.Provider value={{ setNewTitle }}>
            {children}
        </WindowTitleContext.Provider>
    )
}
