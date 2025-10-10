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

const meta: Meta<typeof Component.RichTextArea> = {
    title: 'Components/Input/RichTextArea',
    component: Component.RichTextArea,
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

type Story = StoryObj<typeof Component.RichTextArea>

// Базовый пример
const BasicComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    return (
        <Component.RichTextArea
            {...args}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    )
}

export const Basic: Story = {
    render: BasicComponent,
}

// С предзаполненным контентом
const WithContentComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState(
        '- [ ] Купить молоко\n- [x] Сделать зарядку\n- [ ] Написать отчет\n\n- Обычный список\n- Еще один пункт'
    )
    return (
        <Component.RichTextArea
            {...args}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    )
}

export const WithContent: Story = {
    render: WithContentComponent,
}

// С кнопкой отправки
const WithSubmitComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    const handleSubmit = (val: string) => {
        alert(`Отправлено:\n${val}`)
        setValue('')
    }
    return (
        <Component.RichTextArea
            {...args}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onSubmit={handleSubmit}
            isSubmitDisabled={!value.trim()}
        />
    )
}

export const WithSubmit: Story = {
    render: WithSubmitComponent,
}

// С кнопкой отправки и дополнительными утилитами
const WithUtilsComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    const handleSubmit = (val: string) => {
        alert(`Отправлено:\n${val}`)
        setValue('')
    }
    return (
        <Component.RichTextArea
            {...args}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onSubmit={handleSubmit}
            isSubmitDisabled={!value.trim()}
            placeholder='Напишите комментарий... Кнопки чекбокса и списка добавлены автоматически'
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
