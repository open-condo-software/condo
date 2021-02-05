import React, { createContext, useState } from 'react'
import { ApplicationProvider } from '@ui-kitten/components'
import * as eva from '@eva-design/eva'

export const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => {},
})

export const ThemeState = ({ children }) => {
    const [theme, setTheme] = useState('light')
    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(nextTheme)
    }

    return <ThemeContext.Provider
        value={{ theme, toggleTheme }}
    >
        <ApplicationProvider {...eva} theme={eva[theme]}>
            {children}
        </ApplicationProvider>
    </ThemeContext.Provider>
}
