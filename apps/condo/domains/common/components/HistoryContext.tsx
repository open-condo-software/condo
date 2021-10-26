import React, { createContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'

export const HistoryContext = createContext<string | null>(null)

export const HistoryContextProvider: React.FC = (props) => {
    const [previousUrl, setPreviousUrl] = useState(null)
    const currentUrl = useRef(null)
    const { asPath } = useRouter()

    useEffect(() => {
        if (currentUrl.current !== null) {
            setPreviousUrl(currentUrl.current)
        }
        currentUrl.current = asPath
    }, [asPath])

    return (
        <HistoryContext.Provider value={previousUrl}>
            {props.children}
        </HistoryContext.Provider>
    )
}
