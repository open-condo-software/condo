import classNames from 'classnames'
import React, { useCallback, useMemo, useState, forwardRef, useImperativeHandle } from 'react'
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, Range, Point, BaseEditor } from 'slate'
import { withHistory, HistoryEditor } from 'slate-history'
import { Slate, Editable, withReact, ReactEditor, useSlateStatic, RenderElementProps, RenderLeafProps } from 'slate-react'

import { CheckSquare, List } from '@open-condo/icons'

import { Button } from '../Button'
import { Checkbox } from '../Checkbox'

export interface RichTextAreaProps {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    autoFocus?: boolean
    maxLength?: number
}

export interface RichTextAreaRef {
    focus: () => void
    blur: () => void
    editor?: BaseEditor & ReactEditor & HistoryEditor
}

type CustomElement = 
    | { type: 'paragraph', children: CustomText[] }
    | { type: 'checkbox-item', checked: boolean, children: CustomText[] }
    | { type: 'list-item', children: CustomText[] }

type CustomText = { 
    text: string
    bold?: boolean
    italic?: boolean
    code?: boolean
}

type CustomEditor = BaseEditor & ReactEditor & HistoryEditor

declare module 'slate' {
    interface CustomTypes {
        Editor: CustomEditor
        Element: CustomElement
        Text: CustomText
    }
}

const SHORTCUTS: Record<string, string> = {
    '- [ ]': 'checkbox-item',
    '- [x]': 'checkbox-item-checked',
    '- ': 'list-item',
    '* ': 'list-item',
}

const withMarkdownShortcuts = (editor: CustomEditor) => {
    const { insertText, deleteBackward } = editor

    editor.insertText = (text: string) => {
        const { selection } = editor

        if (text === ' ' && selection && Range.isCollapsed(selection)) {
            const { anchor } = selection
            const block = Editor.above(editor, {
                match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
            })
            const path = block ? block[1] : []
            const start = Editor.start(editor, path)
            const range = { anchor, focus: start }
            const beforeText = Editor.string(editor, range)

            const shortcut = SHORTCUTS[beforeText]
            
            if (shortcut) {
                Transforms.select(editor, range)
                Transforms.delete(editor)
                
                if (shortcut === 'checkbox-item' || shortcut === 'checkbox-item-checked') {
                    Transforms.setNodes(
                        editor,
                        { type: 'checkbox-item', checked: shortcut === 'checkbox-item-checked' } as Partial<CustomElement>,
                        { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
                    )
                } else if (shortcut === 'list-item') {
                    Transforms.setNodes(
                        editor,
                        { type: 'list-item' } as Partial<CustomElement>,
                        { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
                    )
                }
                return
            }
        }

        insertText(text)
    }

    editor.deleteBackward = (...args: Parameters<typeof deleteBackward>) => {
        const { selection } = editor

        if (selection && Range.isCollapsed(selection)) {
            const match = Editor.above(editor, {
                match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
            })

            if (match) {
                const [block, path] = match
                const start = Editor.start(editor, path)

                if (
                    !Editor.isEditor(block) &&
                    SlateElement.isElement(block) &&
                    (block.type === 'checkbox-item' || block.type === 'list-item') &&
                    Point.equals(selection.anchor, start)
                ) {
                    Transforms.setNodes(editor, { type: 'paragraph' } as Partial<CustomElement>)
                    return
                }
            }
        }

        deleteBackward(...args)
    }

    return editor
}

const serializeToMarkdown = (nodes: Descendant[]): string => {
    return nodes
        .map(node => {
            if (SlateElement.isElement(node)) {
                const text = node.children.map(child => {
                    if ('text' in child) {
                        let str = child.text
                        if (child.bold) str = `**${str}**`
                        if (child.italic) str = `*${str}*`
                        if (child.code) str = `\`${str}\``
                        return str
                    }
                    return ''
                }).join('')

                if (node.type === 'checkbox-item') {
                    return `- [${node.checked ? 'x' : ' '}] ${text}`
                }
                if (node.type === 'list-item') {
                    return `- ${text}`
                }
                return text
            }
            return ''
        })
        .join('\n')
}

const deserializeFromMarkdown = (text: string): Descendant[] => {
    if (!text) {
        return [{ type: 'paragraph', children: [{ text: '' }] }]
    }

    const lines = text.split('\n')
    return lines.map(line => {
        const checkboxMatch = line.match(/^- \[([ x])\] (.*)$/)
        if (checkboxMatch) {
            return {
                type: 'checkbox-item',
                checked: checkboxMatch[1] === 'x',
                children: [{ text: checkboxMatch[2] }],
            } as CustomElement
        }

        const listMatch = line.match(/^[-*] (.*)$/)
        if (listMatch) {
            return {
                type: 'list-item',
                children: [{ text: listMatch[1] }],
            } as CustomElement
        }

        return {
            type: 'paragraph',
            children: [{ text: line }],
        } as CustomElement
    })
}

const RichTextArea = forwardRef<RichTextAreaRef, RichTextAreaProps>((props, ref) => {
    const {
        value = '',
        onChange,
        placeholder,
        disabled,
        className,
        autoFocus,
    } = props

    const editor = useMemo(() => withMarkdownShortcuts(withHistory(withReact(createEditor()))), [])
    const [slateValue, setSlateValue] = useState<Descendant[]>(() => deserializeFromMarkdown(value))

    useImperativeHandle(ref, () => ({
        focus: () => {
            try {
                ReactEditor.focus(editor)
            } catch (e) {
                // Editor might not be mounted yet
            }
        },
        blur: () => {
            try {
                ReactEditor.blur(editor)
            } catch (e) {
                // Editor might not be mounted yet
            }
        },
        editor,
    }))

    const handleChange = useCallback((newValue: Descendant[]) => {
        setSlateValue(newValue)
        if (onChange) {
            const stringValue = serializeToMarkdown(newValue)
            onChange(stringValue)
        }
    }, [onChange])

    const renderElement = useCallback((props: RenderElementProps) => {
        switch (props.element.type) {
            case 'checkbox-item':
                return <CheckboxElement {...props} />
            case 'list-item':
                return <ListItemElement {...props} />
            default:
                return <DefaultElement {...props} />
        }
    }, [])

    const renderLeaf = useCallback((props: RenderLeafProps) => {
        return <Leaf {...props} />
    }, [])

    const wrapperClassName = classNames('condo-rich-textarea', className, {
        'condo-rich-textarea-disabled': disabled,
    })

    return (
        <div className={wrapperClassName}>
            <Slate editor={editor} initialValue={slateValue} onChange={handleChange}>
                <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder={placeholder}
                    readOnly={disabled}
                    autoFocus={autoFocus}
                    className='condo-rich-textarea-editable'
                />
            </Slate>
        </div>
    )
})

const CheckboxElement = ({ attributes, children, element }: RenderElementProps) => {
    const editor = useSlateStatic()
    const checked = (element as Extract<CustomElement, { type: 'checkbox-item' }>).checked

    const handleCheckboxChange = (checked: boolean) => {
        const path = ReactEditor.findPath(editor, element)
        Transforms.setNodes(
            editor,
            { checked } as Partial<CustomElement>,
            { at: path }
        )
    }

    return (
        <div {...attributes} className='condo-rich-textarea-checkbox-item'>
            <span contentEditable={false} className='condo-rich-textarea-checkbox-wrapper'>
                <Checkbox checked={checked} onChange={(e) => handleCheckboxChange(e.target.checked)} />
            </span>
            <span className='condo-rich-textarea-checkbox-content'>{children}</span>
        </div>
    )
}

const ListItemElement = ({ attributes, children }: RenderElementProps) => {
    return (
        <div {...attributes} className='condo-rich-textarea-list-item'>
            <span contentEditable={false} className='condo-rich-textarea-bullet'>•</span>
            <span className='condo-rich-textarea-list-content'>{children}</span>
        </div>
    )
}

const DefaultElement = ({ attributes, children }: RenderElementProps) => {
    return <p {...attributes}>{children}</p>
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>
    }

    if (leaf.italic) {
        children = <em>{children}</em>
    }

    if (leaf.code) {
        children = <code>{children}</code>
    }

    return <span {...attributes}>{children}</span>
}

RichTextArea.displayName = 'RichTextArea'

// Helper functions to create toolbar buttons for use in bottomPanelUtils
export const createCheckboxButton = (editor: BaseEditor & ReactEditor & HistoryEditor, disabled?: boolean) => {
    const insertCheckbox = () => {
        const checkbox: CustomElement = {
            type: 'checkbox-item',
            checked: false,
            children: [{ text: '' }],
        }
        Transforms.insertNodes(editor, checkbox)
        Transforms.move(editor)
    }

    return (
        <Button
            minimal
            compact
            key='checkbox'
            type='secondary'
            size='medium'
            icon={<CheckSquare size='small' />}
            onClick={insertCheckbox}
            disabled={disabled}
            title='Добавить чекбокс (или введите - [ ])'
        />
    )
}

export const createListButton = (editor: BaseEditor & ReactEditor & HistoryEditor, disabled?: boolean) => {
    const insertList = () => {
        const listItem: CustomElement = {
            type: 'list-item',
            children: [{ text: '' }],
        }
        Transforms.insertNodes(editor, listItem)
        Transforms.move(editor)
    }

    return (
        <Button
            minimal
            compact
            key='list'
            type='secondary'
            size='medium'
            icon={<List size='small' />}
            onClick={insertList}
            disabled={disabled}
            title='Добавить список (или введите - )'
        />
    )
}

export { RichTextArea }
