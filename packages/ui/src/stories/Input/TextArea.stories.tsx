import React from 'react'

import * as condoIcons from '@open-condo/icons'
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
    'copy-search': [
        <DemoButton icon={<condoIcons.Copy size='small'/>} key='copy' />,
        <DemoButton icon={<condoIcons.Search />} key='search' />,
    ],
    'edit-copy': [
        <DemoButton icon={<condoIcons.Edit size='small'/>} key='edit' />,
        <DemoButton icon={<condoIcons.Copy size='small'/>} key='copy' />,
    ],
    'lock-eye': [
        <DemoButton icon={<condoIcons.Lock size='small'/>} key='lock' />,
        <DemoButton icon={<condoIcons.Eye size='small'/>} key='eye' />,
        <DemoButton icon={<condoIcons.FileUp size='small'/>} key='eye-invisible' />,
    ],
    'full-set': [
        <DemoButton icon={<condoIcons.Copy size='small'/>} key='copy' />,
        <DemoButton icon={<condoIcons.Search size='small'/>} key='search' />,
        <DemoButton icon={<condoIcons.Edit size='small'/>} key='edit' />,
        <DemoButton icon={<condoIcons.Trash size='small'/>} key='trash' text='Delete'/>,
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
        rows: 1,
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
