import React from 'react'

import { Copy, Search } from '@open-condo/icons'
import { Button, RichTextArea } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

const DemoButton = ({ icon, text, disabled }: { text?: string, icon: React.ReactNode, disabled?: boolean }) => (
    <Button
        type='secondary'
        minimal
        compact
        size='medium'
        disabled={disabled}
        icon={icon}
    >{text}</Button>
)

export default {
    title: 'Components/Input',
    component: RichTextArea,
    args: {
        placeholder: 'Start typing...',
        maxLength: 1000,
        showCount: true,
        minHeight: '200px',
        maxHeight: '400px',
        overflowPolicy: 'crop',
        disabled: false,
        isSubmitDisabled: false,
        bottomPanelUtils: [<DemoButton icon={<Copy size='small'/>} key='copy' />, <DemoButton icon={<Search size='small'/>} key='search' />],
    },
    argTypes: {
        overflowPolicy: {
            options: ['crop', 'show'],
            control: { type: 'select' },
        },
        onSubmit: { action: 'submitted' },
        onChange: { action: 'changed' },
    },
} as Meta<typeof RichTextArea>

export const RichText: StoryObj<typeof RichTextArea> = {}

