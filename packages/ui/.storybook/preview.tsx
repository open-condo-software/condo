import React from 'react'
import { styled } from 'storybook/theming'
import '@open-condo/ui/src/components/style/core/global.less'

const PaddedContentWrapper = styled.div`
  max-width: 1200px;
  padding: 40px;
`

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    backgrounds: { disable: true },
    layout: 'fullscreen'
}

export const decorators = [
    (Story: any) => (
        <PaddedContentWrapper>
            <Story/>
        </PaddedContentWrapper>
    )
]
