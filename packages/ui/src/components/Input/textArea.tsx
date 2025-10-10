import classNames from 'classnames'
import React, { forwardRef, useState, useEffect, TextareaHTMLAttributes, useMemo, useCallback, useImperativeHandle } from 'react'
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, Range, Point, BaseEditor } from 'slate'
import { Slate, Editable, withReact, ReactEditor, useSlateStatic, RenderElementProps, RenderLeafProps } from 'slate-react'

import { ArrowUp, CheckSquare, List } from '@open-condo/icons'

import { Button } from '../Button'
import { Checkbox } from '../Checkbox'

import './richTextArea.less'

export const TEXTAREA_CLASS_PREFIX = 'condo-input'

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

export type TextAreaMode = 'plainText' | 'markdown'

export type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style' | 'size' | 'onResize'> & {
    value?: string
    isSubmitDisabled?: boolean
    showCount?: boolean
    onSubmit?: (value: string) => void
    bottomPanelUtils?: React.ReactElement[]
    mode?: TextAreaMode
}

export interface TextAreaRef {
    focus: () => void
    blur: () => void
    editor?: BaseEditor & ReactEditor
}

// Сериализация/десериализация
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
                    Transforms.setNodes(editor, { type: 'paragraph' } as Partial<CustomElement>)
                    return
                }
            }
        }

        deleteBackward(...args)
    }

    editor.deleteFragment = (...args) => {
        deleteFragment(...args)
        
        const nodes = Array.from(Editor.nodes(editor, {
            at: [],
            match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        }))
        
        if (nodes.length === 1) {
            const [node] = nodes[0]
            if (SlateElement.isElement(node) && (node.type === 'checkbox-item' || node.type === 'list-item')) {
                const text = Editor.string(editor, [])
                if (text === '') {
                    Transforms.setNodes(editor, { type: 'paragraph' } as Partial<CustomElement>)
                }
            }
        }
    }

    return editor
}

// Компоненты рендеринга
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

const TextArea = forwardRef<TextAreaRef, TextAreaProps>((props, ref) => {
    const {
        className,
        disabled,
        onSubmit,
        autoFocus,
        maxLength = 1000,
        showCount = true,
        isSubmitDisabled,
        value: propsValue = '',
        bottomPanelUtils = [],
        onChange: propsOnChange,
        mode = 'plainText',
        placeholder,
    } = props

    const editor = useMemo(() => {
        if (mode === 'markdown') {
            return withListBehavior(withReact(createEditor()))
        }
        return withReact(createEditor())
    }, [mode])
    
    const [slateValue, setSlateValue] = useState<Descendant[]>(() => deserializeFromMarkdown(propsValue))

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

    // Синхронизация внешнего value с внутренним состоянием
    useEffect(() => {
        const newSlateValue = deserializeFromMarkdown(propsValue)
        const currentText = serializeToMarkdown(slateValue)
        
        if (propsValue !== currentText) {
            setSlateValue(newSlateValue)
        }
    }, [propsValue])

    const handleChange = useCallback((newValue: Descendant[]) => {
        setSlateValue(newValue)
        if (propsOnChange) {
            const stringValue = serializeToMarkdown(newValue)
            const syntheticEvent = {
                target: { value: stringValue },
            } as React.ChangeEvent<HTMLTextAreaElement>
            propsOnChange(syntheticEvent)
        }
    }, [propsOnChange])

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

    // Проверяем, есть ли реальный контент
    const hasContent = useMemo(() => {
        const allText = slateValue
            .map(node => {
                if (SlateElement.isElement(node)) {
                    return node.children.map(child => 'text' in child ? child.text : '').join('')
                }
                return ''
            })
            .join('')
        
        if (allText.length > 0) return true
        
        const hasSpecialBlocks = slateValue.some(node => {
            if (SlateElement.isElement(node)) {
                return node.type === 'checkbox-item' || node.type === 'list-item'
            }
            return false
        })
        
        return hasSpecialBlocks
    }, [slateValue])

    const currentValue = serializeToMarkdown(slateValue)
    const characterCount = `${currentValue.length}/${maxLength}`

    // Создаем кнопки для markdown mode
    const markdownButtons = useMemo(() => {
        if (mode !== 'markdown' || !editor) return []

        const createCheckboxButton = () => {
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
                    Transforms.setNodes(
                        editor,
                        { type: 'checkbox-item', checked: false } as Partial<CustomElement>,
                        { at: currentPath }
                    )
                    Transforms.select(editor, Editor.start(editor, currentPath))
                } else {
                    Transforms.select(editor, Editor.end(editor, currentPath))
                    const checkbox: CustomElement = {
                        type: 'checkbox-item',
                        checked: false,
                        children: [{ text: '' }],
                    }
                    Transforms.insertNodes(editor, checkbox)
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
                    title='Добавить чекбокс'
                />
            )
        }

        const createListButton = () => {
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
                    Transforms.setNodes(
                        editor,
                        { type: 'list-item' } as Partial<CustomElement>,
                        { at: currentPath }
                    )
                    Transforms.select(editor, Editor.start(editor, currentPath))
                } else {
                    Transforms.select(editor, Editor.end(editor, currentPath))
                    const listItem: CustomElement = {
                        type: 'list-item',
                        children: [{ text: '' }],
                    }
                    Transforms.insertNodes(editor, listItem)
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
                    title='Добавить список'
                />
            )
        }

        return [createCheckboxButton(), createListButton()]
    }, [mode, editor, disabled])

    const allBottomPanelUtils = [...markdownButtons, ...bottomPanelUtils]
    const hasBottomPanelUtils = allBottomPanelUtils.length > 0
    const shouldShowRightPanel = showCount || onSubmit
    const showBottomPanel = hasBottomPanelUtils || shouldShowRightPanel

    const wrapperClassName = classNames(
        'condo-rich-textarea',
        `${TEXTAREA_CLASS_PREFIX}-textarea-wrapper`,
        {
            'condo-rich-textarea-disabled': disabled,
        },
        className
    )

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

TextArea.displayName = 'TextArea'

export { TextArea }
