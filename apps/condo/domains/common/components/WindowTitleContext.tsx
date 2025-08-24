import get from 'lodash/get'
import isNull from 'lodash/isNull'
import React, { useEffect, createContext, useContext, useState, useRef } from 'react'

type WindowTitleChange = {
    label: string | null
    iconPath: string
    count: number
}
interface IWindowTitleContext {
    unreadCount: number
    setTitleConfig: React.Dispatch<React.SetStateAction<WindowTitleChange | null>>
}
const TITLE_BLINK_INTERVAL = 3000

const WindowTitleContext = createContext<IWindowTitleContext>({ setTitleConfig: () => null, unreadCount: 0 })

export const useWindowTitleContext = (): IWindowTitleContext => useContext(WindowTitleContext)

const getFaviconHref = () => document.getElementById('favicon').getAttribute('href')

const changeFavicon = (href: string) => document.getElementById('favicon').setAttribute('href', href)

export const WindowTitleContextProvider: React.FC<React.PropsWithChildren<{ title: string }>> = ({ children, title }) => {
    const [titleConfig, setTitleConfig] = useState<WindowTitleChange>(null)
    const intervalRef = useRef(null)
    const originalIconHref = useRef(null)

    useEffect(() => {
        const onFocus = () => {
            if (!isNull(titleConfig)) {
                clearInterval(intervalRef.current)
                document.title = title
                changeFavicon(originalIconHref.current)

                intervalRef.current = null
                setTitleConfig(null)
            }
        }

        if (typeof window !== 'undefined' && isNull(titleConfig)) {
            originalIconHref.current = getFaviconHref()

            window.removeEventListener('focus', onFocus)
            window.removeEventListener('mousemove', onFocus)
        }

        if (typeof window !== 'undefined' && !isNull(titleConfig)) {
            if (document.hasFocus()) {
                changeFavicon(titleConfig.iconPath)
                document.title = titleConfig.label

                setTimeout(() => {
                    changeFavicon(originalIconHref.current)
                    document.title = title
                    setTitleConfig(null)
                }, TITLE_BLINK_INTERVAL)
            } else {
                if (!isNull(intervalRef.current)) {
                    clearInterval(intervalRef.current)
                }

                intervalRef.current = setInterval(() => {
                    if (document.title !== title) {
                        changeFavicon(originalIconHref.current)
                        document.title = title
                    } else {
                        changeFavicon(titleConfig.iconPath)
                        document.title = titleConfig.label
                    }
                }, TITLE_BLINK_INTERVAL)

                window.removeEventListener('focus', onFocus)
                window.removeEventListener('mousemove', onFocus)
                window.addEventListener('focus', onFocus)
                window.addEventListener('mousemove', onFocus)
            }
        }

        return () => {
            window.removeEventListener('focus', onFocus)
            window.removeEventListener('mousemove', onFocus)
        }
    }, [titleConfig])

    return (
        <WindowTitleContext.Provider value={{ setTitleConfig, unreadCount: get(titleConfig, 'count', 0) }}>
            {children}
        </WindowTitleContext.Provider>
    )
}
