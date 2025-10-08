import React, { useState } from 'react'

import { Copy, Paperclip, Sparkles } from '@open-condo/icons'
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
    title: 'Components/Input/RichTextArea',
    component: Component.TextArea,
    args: {
        enableRichText: true,
        placeholder: 'Попробуйте ввести: - [ ] для чекбокса или - для списка',
        bottomPanelUtils: utilButtons,
        autoSize: { minRows: 3, maxRows: 10 },
        disabled: false,
        showCount: true,
        maxLength: 1000,
    },
    argTypes: {
        enableRichText: {
            control: 'boolean',
            description: 'Включить WYSIWYG режим с поддержкой markdown',
        },
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

// Базовый пример
const BasicComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    return (
        <Component.TextArea
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
        <Component.TextArea
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
        <Component.TextArea
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

// Список задач
const TaskListComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState(
        '# Мои задачи на сегодня\n\n- [ ] Проверить почту\n- [ ] Созвониться с командой\n- [x] Написать отчет\n- [ ] Обновить документацию\n\n## Заметки\n\n- Важная встреча в 15:00\n- Не забыть про дедлайн'
    )
    return (
        <div style={{ maxWidth: '600px' }}>
            <Component.TextArea
                {...args}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder='Добавьте задачи...'
                autoSize={{ minRows: 5, maxRows: 15 }}
            />
        </div>
    )
}

export const TaskList: Story = {
    render: TaskListComponent,
}

// Комментарии с утилитами
const CommentBoxComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    const [comments, setComments] = useState<string[]>([])
    
    const handleSubmit = (val: string) => {
        if (val.trim()) {
            setComments([...comments, val])
            setValue('')
        }
    }
    
    return (
        <div style={{ maxWidth: '700px' }}>
            <div style={{ marginBottom: '20px' }}>
                {comments.map((comment, idx) => (
                    <div 
                        key={idx} 
                        style={{ 
                            padding: '12px', 
                            marginBottom: '8px', 
                            background: '#f5f5f5', 
                            borderRadius: '6px',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {comment}
                    </div>
                ))}
            </div>
            
            <Component.TextArea
                {...args}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onSubmit={handleSubmit}
                isSubmitDisabled={!value.trim()}
                placeholder='Напишите комментарий... Попробуйте - [ ] для чекбокса'
                bottomPanelUtils={[
                    <DemoButton icon={<Paperclip size='small'/>} key='attach' />,
                    <DemoButton icon={<Sparkles size='small'/>} key='ai' />,
                    <DemoButton icon={<Copy size='small'/>} key='copy' />,
                ]}
            />
        </div>
    )
}

export const CommentBox: Story = {
    render: CommentBoxComponent,
}

// Отключенное состояние
const DisabledComponent = (args: typeof meta.args) => {
    const [value] = useState('- [x] Эта задача выполнена\n- [ ] Редактирование отключено')
    return (
        <Component.TextArea
            {...args}
            value={value}
            disabled={true}
        />
    )
}

export const Disabled: Story = {
    render: DisabledComponent,
}

// Сравнение: обычный vs rich text
const ComparisonComponent = () => {
    const [normalValue, setNormalValue] = useState('- [ ] Обычный текст\n- [x] Без форматирования')
    const [richValue, setRichValue] = useState('- [ ] Rich text\n- [x] С форматированием')
    
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
                <h3 style={{ marginBottom: '10px' }}>Обычный TextArea</h3>
                <Component.TextArea
                    enableRichText={false}
                    value={normalValue}
                    onChange={(e) => setNormalValue(e.target.value)}
                    placeholder='Обычный режим'
                    autoSize={{ minRows: 3, maxRows: 10 }}
                />
            </div>
            <div>
                <h3 style={{ marginBottom: '10px' }}>Rich TextArea</h3>
                <Component.TextArea
                    enableRichText={true}
                    value={richValue}
                    onChange={(e) => setRichValue(e.target.value)}
                    placeholder='WYSIWYG режим'
                    autoSize={{ minRows: 3, maxRows: 10 }}
                />
            </div>
        </div>
    )
}

export const Comparison: Story = {
    render: ComparisonComponent,
}

// Примеры синтаксиса
const SyntaxExamplesComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    
    const examples = [
        { label: 'Чекбокс', syntax: '- [ ] ' },
        { label: 'Отмеченный чекбокс', syntax: '- [x] ' },
        { label: 'Список', syntax: '- ' },
        { label: 'Список (альтернатива)', syntax: '* ' },
    ]
    
    return (
        <div style={{ maxWidth: '700px' }}>
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0 }}>Подсказки по синтаксису:</h4>
                <ul style={{ marginBottom: 0 }}>
                    {examples.map((ex, idx) => (
                        <li key={idx}>
                            <strong>{ex.label}:</strong> введите <code style={{ 
                                background: '#fff', 
                                padding: '2px 6px', 
                                borderRadius: '3px',
                                fontFamily: 'monospace',
                            }}>{ex.syntax}</code> и нажмите пробел
                        </li>
                    ))}
                </ul>
            </div>
            
            <Component.TextArea
                {...args}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder='Попробуйте примеры выше...'
            />
        </div>
    )
}

export const SyntaxExamples: Story = {
    render: SyntaxExamplesComponent,
}

// Минимальный пример
const MinimalComponent = (args: typeof meta.args) => {
    const [value, setValue] = useState('')
    return (
        <Component.TextArea
            {...args}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            showCount={false}
            bottomPanelUtils={[]}
        />
    )
}

export const Minimal: Story = {
    render: MinimalComponent,
}
