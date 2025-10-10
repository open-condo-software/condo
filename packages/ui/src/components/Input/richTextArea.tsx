import classNames from 'classnames'
import React, { useCallback, useMemo, useState, forwardRef, useImperativeHandle, useEffect, useRef, TextareaHTMLAttributes } from 'react'
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, Range, Point, BaseEditor } from 'slate'
import { Slate, Editable, withReact, ReactEditor, useSlateStatic, RenderElementProps, RenderLeafProps } from 'slate-react'

import { CheckSquare, List, ArrowUp } from '@open-condo/icons'

import { Button } from '../Button'
import { Checkbox } from '../Checkbox'

import type { InputRef } from 'antd'

import './richTextArea.less'

export interface RichTextAreaProps {
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    autoFocus?: boolean
    maxLength?: number
}

export interface RichTextAreaRef {
    focus: () => void
    blur: () => void
}

export interface RichTextAreaRefInternal extends RichTextAreaRef {
    editor?: BaseEditor & ReactEditor
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

type CustomEditor = BaseEditor & ReactEditor

declare module 'slate' {
    interface CustomTypes {
        Editor: CustomEditor
        Element: CustomElement
        Text: CustomText
    }
}

// const SHORTCUTS: Record<string, string> = {
//     '- [ ]': 'checkbox-item',
//     '- [x]': 'checkbox-item-checked',
//     '- ': 'list-item',
//     '* ': 'list-item',
// }

// const withMarkdownShortcuts = (editor: CustomEditor) => {
//     const { insertText, deleteFragment } = editor

//     // editor.insertText = (text: string) => {
//     //     const { selection } = editor

//     //     if (text === ' ' && selection && Range.isCollapsed(selection)) {
//     //         const { anchor } = selection
//     //         const block = Editor.above(editor, {
//     //             match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
//     //         })
//     //         const path = block ? block[1] : []
//     //         const start = Editor.start(editor, path)
//     //         const range = { anchor, focus: start }
//     //         const beforeText = Editor.string(editor, range)

//     //         const shortcut = SHORTCUTS[beforeText]
            
//     //         if (shortcut) {
//     //             Transforms.select(editor, range)
//     //             Transforms.delete(editor)
                
//     //             if (shortcut === 'checkbox-item' || shortcut === 'checkbox-item-checked') {
//     //                 Transforms.setNodes(
//     //                     editor,
//     //                     { type: 'checkbox-item', checked: shortcut === 'checkbox-item-checked' } as Partial<CustomElement>,
//     //                     { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
//     //                 )
//     //             } else if (shortcut === 'list-item') {
//     //                 Transforms.setNodes(
//     //                     editor,
//     //                     { type: 'list-item' } as Partial<CustomElement>,
//     //                     { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
//     //                 )
//     //             }
//     //             return
//     //         }
//     //     }

//     //     insertText(text)
//     // }

//     // editor.deleteFragment = (...args: Parameters<typeof deleteFragment>) => {
//     //     deleteFragment(...args)
        
//     //     // After deleting selection, ensure we have at least one paragraph
//     //     const nodes = Array.from(Editor.nodes(editor, {
//     //         at: [],
//     //         match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
//     //     }))
        
//     //     if (nodes.length === 1) {
//     //         const [node] = nodes[0]
//     //         console.log('node', node)
//     //         if (SlateElement.isElement(node) && (node.type === 'checkbox-item' || node.type === 'list-item')) {
//     //             Transforms.setNodes(editor, { type: 'paragraph' } as Partial<CustomElement>)
//     //         }
//     //     }
//     // }

//     return editor
// }

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

// Plugin для обработки Enter и Backspace на чекбоксах и списках
const withListBehavior = (editor: CustomEditor) => {
    const { insertBreak, deleteBackward, deleteFragment } = editor

    editor.insertBreak = () => {
        const { selection } = editor
        if (!selection) {
            insertBreak()
            return
        }

        const match = Editor.above(editor, {
            match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        })

        if (match) {
            const [block, path] = match
            if (SlateElement.isElement(block) && (block.type === 'checkbox-item' || block.type === 'list-item')) {
                const blockText = Editor.string(editor, path)
                
                // Если блок пустой, превращаем в параграф
                if (blockText === '') {
                    Transforms.setNodes(editor, { type: 'paragraph' } as Partial<CustomElement>)
                    return
                }
            }
        }

        insertBreak()
    }

    editor.deleteBackward = (...args) => {
        const { selection } = editor

        if (selection && Range.isCollapsed(selection)) {
            const match = Editor.above(editor, {
                match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
            })

            if (match) {
                const [block, path] = match
                const start = Editor.start(editor, path)

                if (
                    SlateElement.isElement(block) &&
                    (block.type === 'checkbox-item' || block.type === 'list-item') &&
                    Point.equals(selection.anchor, start)
                ) {
                    // Если курсор в начале чекбокса/списка, превращаем в параграф
                    Transforms.setNodes(editor, { type: 'paragraph' } as Partial<CustomElement>)
                    return
                }
            }
        }

        deleteBackward(...args)
    }

    editor.deleteFragment = (...args) => {
        deleteFragment(...args)
        
        // После удаления выделенного фрагмента проверяем оставшиеся блоки
        const nodes = Array.from(Editor.nodes(editor, {
            at: [],
            match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        }))
        
        // Если остался только один блок и он чекбокс/список, превращаем в параграф
        if (nodes.length === 1) {
            const [node] = nodes[0]
            if (SlateElement.isElement(node) && (node.type === 'checkbox-item' || node.type === 'list-item')) {
                const text = Editor.string(editor, [])
                // Превращаем в параграф только если блок пустой
                if (text === '') {
                    Transforms.setNodes(editor, { type: 'paragraph' } as Partial<CustomElement>)
                }
            }
        }
    }

    return editor
}

const RichTextArea = forwardRef<RichTextAreaRefInternal, RichTextAreaProps>((props, ref) => {
    const {
        value = '',
        onChange,
        placeholder,
        disabled,
        className,
        autoFocus,
    } = props

    const editor = useMemo(() => withListBehavior(withReact(createEditor())), [])
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
    }), [editor])

    const handleChange = useCallback((newValue: Descendant[]) => {
        setSlateValue(newValue)
        if (onChange) {
            const stringValue = serializeToMarkdown(newValue)
            const syntheticEvent = {
                target: { value: stringValue },
            } as React.ChangeEvent<HTMLTextAreaElement>
            onChange(syntheticEvent)
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

    // Проверяем, есть ли реальный контент (не только пустые блоки)
    const hasContent = useMemo(() => {
        // Проверяем весь текст во всех блоках
        const allText = slateValue
            .map(node => {
                if (SlateElement.isElement(node)) {
                    return node.children.map(child => 'text' in child ? child.text : '').join('')
                }
                return ''
            })
            .join('')
        
        // Если есть текст - контент есть
        if (allText.length > 0) return true
        
        // Если нет текста, но есть чекбоксы или списки - тоже считаем что контент есть
        const hasSpecialBlocks = slateValue.some(node => {
            if (SlateElement.isElement(node)) {
                return node.type === 'checkbox-item' || node.type === 'list-item'
            }
            return false
        })
        
        return hasSpecialBlocks
    }, [slateValue])

    const wrapperClassName = classNames('condo-rich-textarea', className, {
        'condo-rich-textarea-disabled': disabled,
    })

    return (
        <div className={wrapperClassName}>
            <Slate editor={editor} initialValue={slateValue} onChange={handleChange}>
                <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder={hasContent ? undefined : placeholder}
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

// Internal helper type for button creation
type EditorInstance = BaseEditor & ReactEditor

/**
 * Ready-to-use button components for RichTextArea toolbar
 * These can be used directly without any Slate knowledge
 */

// Props for ready-made buttons
export interface RichTextButtonProps {
    disabled?: boolean
}

/**
 * Ready-made Checkbox button component
 * Usage: <RichTextCheckboxButton editor={ref.current?.editor} />
 */
export const RichTextCheckboxButton: React.FC<{ editor?: EditorInstance, disabled?: boolean }> = ({ editor, disabled }) => {
    if (!editor) return null
    return createCheckboxButton(editor, disabled)
}

/**
 * Ready-made List button component
 * Usage: <RichTextListButton editor={ref.current?.editor} />
 */
export const RichTextListButton: React.FC<{ editor?: EditorInstance, disabled?: boolean }> = ({ editor, disabled }) => {
    if (!editor) return null
    return createListButton(editor, disabled)
}

// Internal helper functions for use with editor instance (for advanced users)
// These require Slate knowledge and direct editor access
const createCheckboxButton = (editor: EditorInstance, disabled?: boolean) => {
    const insertCheckbox = () => {
        const { selection } = editor
        if (!selection) return

        const match = Editor.above(editor, {
            match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        })
        
        if (!match) return
        const [currentNode, currentPath] = match
        
        if (!SlateElement.isElement(currentNode)) return
        
        const blockText = Editor.string(editor, currentPath)
        const isEmptyBlock = blockText === ''

        if (isEmptyBlock) {
            // Convert current empty block to checkbox
            Transforms.setNodes(
                editor,
                { type: 'checkbox-item', checked: false } as Partial<CustomElement>,
                { at: currentPath }
            )
            // Фокус на начало блока
            Transforms.select(editor, Editor.start(editor, currentPath))
        } else {
            // Move to end of current block and insert new checkbox
            Transforms.select(editor, Editor.end(editor, currentPath))
            const checkbox: CustomElement = {
                type: 'checkbox-item',
                checked: false,
                children: [{ text: '' }],
            }
            Transforms.insertNodes(editor, checkbox)
            // Фокус переместится автоматически на новый блок
        }
        
        ReactEditor.focus(editor)
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

const createListButton = (editor: EditorInstance, disabled?: boolean) => {
    const insertList = () => {
        const { selection } = editor
        if (!selection) return

        const match = Editor.above(editor, {
            match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        })
        
        if (!match) return
        const [currentNode, currentPath] = match
        
        if (!SlateElement.isElement(currentNode)) return
        
        const blockText = Editor.string(editor, currentPath)
        const isEmptyBlock = blockText === ''

        if (isEmptyBlock) {
            // Convert current empty block to list item
            Transforms.setNodes(
                editor,
                { type: 'list-item' } as Partial<CustomElement>,
                { at: currentPath }
            )
            // Фокус на начало блока
            Transforms.select(editor, Editor.start(editor, currentPath))
        } else {
            // Move to end of current block and insert new list item
            Transforms.select(editor, Editor.end(editor, currentPath))
            const listItem: CustomElement = {
                type: 'list-item',
                children: [{ text: '' }],
            }
            Transforms.insertNodes(editor, listItem)
            // Фокус переместится автоматически на новый блок
        }
        
        ReactEditor.focus(editor)
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

// RichTextArea with bottom panel - full-featured component
const TEXTAREA_CLASS_PREFIX = 'condo-input'

export type RichTextAreaWithPanelProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style' | 'size' | 'onResize'> & {
    value?: string
    isSubmitDisabled?: boolean
    showCount?: boolean
    onSubmit?: (value: string) => void
    bottomPanelUtils?: React.ReactElement[]
    maxLength?: number
}

const RichTextAreaWithPanel = forwardRef<InputRef, RichTextAreaWithPanelProps>((props, ref) => {
    const {
        className,
        disabled,
        onSubmit,
        autoFocus,
        maxLength = 1000,
        showCount = true,
        isSubmitDisabled,
        value: propsValue,
        bottomPanelUtils = [],
        onChange: propsOnChange,
        placeholder,
    } = props

    const [internalValue, setInternalValue] = useState('')
    const editorRef = useRef<RichTextAreaRefInternal>(null)

    // Forward ref to editor
    useImperativeHandle(ref, () => editorRef.current as InputRef, [])

    useEffect(() => {
        if (propsValue !== undefined) {
            setInternalValue(propsValue)
        }
    }, [propsValue])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value

        if (propsValue === undefined) {
            setInternalValue(newValue)
        }

        if (propsOnChange) {
            propsOnChange(e)
        }
    }

    const currentValue = propsValue !== undefined ? propsValue : internalValue
    const characterCount = `${currentValue.length}/${maxLength}`

    // Add rich text buttons
    const editor = editorRef.current?.editor
    const richTextButtons = [
        <RichTextCheckboxButton key='checkbox' editor={editor} disabled={disabled} />,
        <RichTextListButton key='list' editor={editor} disabled={disabled} />,
    ]
    const allBottomPanelUtils = [...richTextButtons, ...bottomPanelUtils]
    
    const hasBottomPanelUtils = allBottomPanelUtils.length > 0
    const shouldShowRightPanel = showCount || onSubmit
    const showBottomPanel = hasBottomPanelUtils || shouldShowRightPanel

    const textareaClassName = classNames(
        `${TEXTAREA_CLASS_PREFIX}-textarea`,
        {
            [`${TEXTAREA_CLASS_PREFIX}-disabled`]: disabled,
            [`${TEXTAREA_CLASS_PREFIX}-show-bottom-panel`]: showBottomPanel,
            [`${TEXTAREA_CLASS_PREFIX}-focused`]: autoFocus,
        },
        className,
    )

    const textAreaWrapperClassName = classNames(
        `${TEXTAREA_CLASS_PREFIX} ${TEXTAREA_CLASS_PREFIX}-textarea-wrapper`,
        {
            [`${TEXTAREA_CLASS_PREFIX}-disabled`]: disabled,
        },
    )

    return (
        <div className={textAreaWrapperClassName}>
            <RichTextArea
                ref={editorRef}
                value={currentValue}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className={textareaClassName}
                autoFocus={autoFocus}
                maxLength={maxLength}
            />

            {showBottomPanel && (
                <span className={`${TEXTAREA_CLASS_PREFIX}-bottom-panel`}>
                    {hasBottomPanelUtils && (
                        <span className={`${TEXTAREA_CLASS_PREFIX}-utils`}>
                            {allBottomPanelUtils.map((util, index) => (
                                <React.Fragment key={index}>
                                    {React.cloneElement(util, { disabled: util.props.disabled || disabled })}
                                </React.Fragment>
                            ))}
                        </span>
                    )}

                    {shouldShowRightPanel && (
                        <span className={`${TEXTAREA_CLASS_PREFIX}-bottom-panel-right`}>
                            {showCount && (
                                <span className={`${TEXTAREA_CLASS_PREFIX}-count`}>
                                    {characterCount}
                                </span>
                            )}

                            {
                                onSubmit &&
                                <Button
                                    disabled={disabled || isSubmitDisabled}
                                    type='accent'
                                    size='medium'
                                    onClick={() => onSubmit(currentValue)}
                                    icon={<ArrowUp size='small' />}
                                />
                            }
                        </span>
                    )}
                </span>
            )}
        </div>
    )
})

RichTextAreaWithPanel.displayName = 'RichTextAreaWithPanel'

export { RichTextArea, RichTextAreaWithPanel }
