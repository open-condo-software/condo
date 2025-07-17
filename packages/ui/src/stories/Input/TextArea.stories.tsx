import React from 'react'

import { Copy, Search, Edit, Eye, FileUp, Trash, Lock } from '@open-condo/icons'
import { Button, Input as Component } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react'

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

const iconCombinations = {
    'empty': [],
    'copy-search': [
        <DemoButton icon={<Copy size='small'/>} key='copy' />,
        <DemoButton icon={<Search size='small'/>} key='search' />,
    ],
    'edit-copy': [
        <DemoButton icon={<Edit size='small'/>} key='edit' />,
        <DemoButton icon={<Copy size='small'/>} key='copy' />,
    ],
    'lock-eye': [
        <DemoButton icon={<Lock size='small'/>} key='lock' />,
        <DemoButton icon={<Eye size='small'/>} key='eye' />,
        <DemoButton icon={<FileUp size='small'/>} key='eye-invisible' />,
    ],
    'full-set': [
        <DemoButton icon={<Copy size='small'/>} key='copy' />,
        <DemoButton icon={<Search size='small'/>} key='search' />,
        <DemoButton icon={<Edit size='small'/>} key='edit' />,
        <DemoButton icon={<Trash size='small'/>} key='trash' text='Delete'/>,
    ],
}

export default {
    title: 'Components/Input',
    component: Component.TextArea,
    args: {
        placeholder: 'Placeholder',
        bottomPanelUtils: iconCombinations['copy-search'],
        autoSize: { minRows: 1, maxRows: 4 },
        disabled: false,
        showCount: true,
    },
    argTypes: {
        onSubmit: {
            options: [false, () => alert('Submit')],
            mapping: iconCombinations,
            control: {
                type: 'select',
            },
        },
        bottomPanelUtils: {
            options: Object.keys(iconCombinations),
            mapping: iconCombinations,
            control: {
                type: 'select',
            },
        },
    },
} as Meta<typeof Component.TextArea>

export const TextArea: StoryObj<typeof Component.TextArea> = {}
