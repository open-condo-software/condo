import React from 'react'

import { Copy, Smile, Sparkles } from '@open-condo/icons'
import { Button, Tooltip, Input as Component } from '@open-condo/ui/src'
import type { ToolbarGroup } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

const DemoButton = ({ icon, text, disabled }: { text?: string, icon: React.ReactNode, disabled?: boolean }) => (
    <Tooltip title={text} mouseEnterDelay={1} mouseLeaveDelay={0}>
        <Button
            type='secondary'
            minimal
            compact
            size='medium'
            disabled={disabled}
            icon={icon}
        />
    </Tooltip>
)

const DEMO_BOTTOM_PANEL_UTILS = [
    <DemoButton icon={<Copy size='small'/>} text='Copy' key='copy' />,
    <DemoButton icon={<Smile size='small'/>} text='Smile' key='smile' />,
    <DemoButton icon={<Sparkles size='small'/>} text='Sparkles' key='sparkles' />,
]

const ALL_TOOLBAR_GROUPS: ToolbarGroup[] = [
    ['undo', 'redo'],
    ['heading', 'bold', 'italic', 'strikethrough'],
    ['link', 'image'],
    ['unorderedList', 'orderedList', 'taskList', 'blockquote'],
    ['table'],
    ['removeFormating'],
]

const ALL_FEATURES_MD = [
    '# Heading 1',
    '',
    '## Heading 2',
    '',
    '### Heading 3',
    '',
    '#### Heading 4',
    '',
    '##### Heading 5',
    '',
    '###### Heading 6',
    '',
    'Regular paragraph with **bold**, *italic*, ~~strikethrough~~, and **_bold italic_** text.',
    '',
    'Paragraph with a [link to example](https://example.com) inside text.',
    '',
    '- [ ] Unchecked task',
    '- [x] Completed task',
    '- [ ] Another pending task',
    '',
    '- Bullet item one',
    '- Bullet item two',
    '  - Nested bullet A',
    '  - Nested bullet B',
    '- Bullet item three',
    '',
    '1. First ordered',
    '2. Second ordered',
    '3. Third ordered',
    '',
    '> Blockquote paragraph.',
    '>',
    '> Second line of blockquote.',
    '',
    '```typescript',
    'function greet(name: string): string {',
    '    return `Hello, ${name}!`',
    '}',
    '```',
    '',
    '| Name | Role | Status |',
    '| --- | --- | --- |',
    '| Alice | Admin | Active |',
    '| Bob | User | Inactive |',
    '',
    '---',
    '',
    '![Sample image](https://placehold.co/400x120/e2e8f0/475569?text=Image+Preview)',
    '',
    'Inline `code snippet` inside a paragraph.',
].join('\n')

export default {
    title: 'Components/Input',
    component: Component.RichTextArea,
    args: {
        placeholder: 'Start typing...',
        maxLength: 5000,
        showCount: true,
        autoSize: { minRows: 6, maxRows: 20 },
        overflowPolicy: 'show',
        disabled: false,
        isSubmitDisabled: false,
        type: 'default',
        toolbarGroups: ALL_TOOLBAR_GROUPS,
        value: ALL_FEATURES_MD,
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
        toolbarGroups: {
            control: { type: 'object' },
        },
        onSubmit: { action: 'submitted' },
        onChange: { action: 'changed' },
    },
} as Meta<typeof Component.RichTextArea>

export const RichTextArea: StoryObj<typeof Component.RichTextArea> = {}
