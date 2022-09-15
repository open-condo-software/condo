import React from 'react'
import { ThemeProvider, convert, Global, createReset } from '@storybook/theming'
import customTheme from './theme'

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    backgrounds: { disable: true },
}

export const decorators = [
    (StoryFn: React.FC) => {
        return (
            <ThemeProvider theme={convert(customTheme)}>
                <Global styles={createReset}/>
                <StoryFn/>
            </ThemeProvider>
        )
    }
]