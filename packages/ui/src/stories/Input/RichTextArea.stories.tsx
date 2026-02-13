import React from 'react'

import { Copy, Smile, Sparkles } from '@open-condo/icons'
import { Button, Input as Component } from '@open-condo/ui/src'

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

const DEMO_BOTTOM_PANEL_UTILS = [
    <DemoButton icon={<Copy size='small'/>} key='copy' />,
    <DemoButton icon={<Smile size='small'/>} key='smile' />,
    <DemoButton icon={<Sparkles size='small'/>} key='sparkles' />,
]

export default {
    title: 'Components/Input',
    component: Component.RichTextArea,
    args: {
        placeholder: 'Placeholder',
        maxLength: 1000,
        showCount: true,
        autoSize: { minRows: 1, maxRows: 4 },
        overflowPolicy: 'crop',
        disabled: false,
        isSubmitDisabled: false,
        type: 'default',
        bottomPanelUtils: DEMO_BOTTOM_PANEL_UTILS,
    },
    argTypes: {
        type: {
            options: ['default', 'inline'],
            control: { type: 'select' },
        },
        overflowPolicy: {
            options: ['crop', 'show'],
            control: { type: 'select' },
        },
        onSubmit: { action: 'submitted' },
        onChange: { action: 'changed' },
    },
} as Meta<typeof Component.RichTextArea>

export const RichTextArea: StoryObj<typeof Component.RichTextArea> = {}
