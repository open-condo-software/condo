import isNull from 'lodash/isNull'
import React, { useEffect, createContext, useContext, useState, useRef } from 'react'

type WindowTitleChange = {
    label: string | null
    iconPath: string
}
interface IWindowTitleContext {
    setTitleConfig: React.Dispatch<React.SetStateAction<WindowTitleChange | null>>
}
const TITLE_BLINK_INTERVAL = 3000

const WindowTitleContext = createContext<IWindowTitleContext>({ setTitleConfig: () => null })

export const useWindowTitleContext = (): IWindowTitleContext => useContext(WindowTitleContext)

const getFaviconHref = () => document.getElementById('favicon').getAttribute('href')

const changeFavicon = (href: string) => document.getElementById('favicon').setAttribute('href', href)

export const WindowTitleContextProvider: React.FC = ({ children }) => {
    const [titleConfig, setTitleConfig] = useState<WindowTitleChange>(null)
    const intervalRef = useRef(null)
    const originalTitle = useRef(null)
    const originalIconHref = useRef(null)

    useEffect(() => {
        const onFocus = () => {
            if (!isNull(titleConfig)) {
                clearInterval(intervalRef.current)
                document.title = originalTitle.current
                changeFavicon(originalIconHref.current)

                intervalRef.current = null
                setTitleConfig(null)
            }
        }

        if (typeof window !== 'undefined' && !isNull(titleConfig)) {
            originalTitle.current = document.title
            originalIconHref.current = getFaviconHref()

            if (document.hasFocus()) {
                changeFavicon(titleConfig.iconPath)
                document.title = titleConfig.label

                setTimeout(() => {
                    changeFavicon(originalIconHref.current)
                    document.title = originalTitle.current
                    setTitleConfig(null)
                }, TITLE_BLINK_INTERVAL)
            } else {
                intervalRef.current = setInterval(() => {
                    if (document.title !== originalTitle.current) {
                        changeFavicon(originalIconHref.current)
                        document.title = originalTitle.current
                    } else {
                        changeFavicon(titleConfig.iconPath)
                        document.title = titleConfig.label
                    }
                }, TITLE_BLINK_INTERVAL)

                window.addEventListener('focus', onFocus)
            }
        }

        return () => {
            window.removeEventListener('focus', onFocus)
        }
    }, [titleConfig])

    return (
        <WindowTitleContext.Provider value={{ setTitleConfig }}>
            {children}
        </WindowTitleContext.Provider>
    )
}
