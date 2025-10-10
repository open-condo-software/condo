import React, { useState } from 'react'

import { Copy, Paperclip } from '@open-condo/icons'
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

const utilButtons = [
    <DemoButton icon={<Paperclip size='small'/>} key='attach' />,
    <DemoButton icon={<Copy size='small'/>} key='copy' />,
]

const meta: Meta<typeof Component.TextArea> = {
    title: 'Components/Input/TextArea',
    component: Component.TextArea,
    args: {
        placeholder: 'Попробуйте ввести: - [ ] для чекбокса или - для списка',
        bottomPanelUtils: utilButtons,
        disabled: false,
        showCount: true,
        maxLength: 1000,
    },
    argTypes: {
        onSubmit: {
            control: false,
        },
        bottomPanelUtils: {
            control: false,
        },
    },
}

export default meta

type Story = StoryObj<typeof Component.TextArea>

// Базовый пример plainText
const BasicComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    return (
        <Component.TextArea
            {...args}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
            mode='plainText'
        />
    )
}

export const Basic: Story = {
    render: BasicComponent,
}

// С markdown mode и контентом
const WithContentComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState(
        '- [ ] Купить молоко\n- [x] Сделать зарядку\n- [ ] Написать отчет\n\n- Обычный список\n- Еще один пункт'
    )
    return (
        <Component.TextArea
            {...args}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
            mode='markdown'
        />
    )
}

export const WithContent: Story = {
    render: WithContentComponent,
}

// С кнопкой отправки и markdown
const WithSubmitComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    const handleSubmit = (val: string) => {
        alert(`Отправлено:\n${val}`)
        setValue('')
    }
    return (
        <Component.TextArea
            {...args}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
            onSubmit={handleSubmit}
            isSubmitDisabled={!value.trim()}
            mode='markdown'
        />
    )
}

export const WithSubmit: Story = {
    render: WithSubmitComponent,
}

// С markdown mode и дополнительными утилитами
const WithUtilsComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    const handleSubmit = (val: string) => {
        alert(`Отправлено:\n${val}`)
        setValue('')
    }
    return (
        <Component.TextArea
            {...args}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
            onSubmit={handleSubmit}
            isSubmitDisabled={!value.trim()}
            placeholder='Напишите комментарий... Кнопки чекбокса и списка добавлены автоматически в markdown mode'
            mode='markdown'
            bottomPanelUtils={[
                <DemoButton icon={<Paperclip size='small'/>} key='attach' />,
                <DemoButton icon={<Copy size='small'/>} key='copy' />,
            ]}
        />
    )
}

export const WithUtils: Story = {
    render: WithUtilsComponent,
}
