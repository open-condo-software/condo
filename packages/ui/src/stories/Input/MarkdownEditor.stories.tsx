import { MarkdownEditor } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Input',
    component: MarkdownEditor,
    args: {
        placeholder: 'Start typing markdown...',
        maxLength: 1000,
        minHeight: '200px',
        maxHeight: '400px',
        overflowPolicy: 'crop',
    },
    argTypes: {
        overflowPolicy: {
            options: ['crop', 'show'],
            control: {
                type: 'select',
            },
        },
    },
} as Meta<typeof MarkdownEditor>

export const Markdown: StoryObj<typeof MarkdownEditor> = {}
