import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { Markdown } from '@tiptap/markdown'
import { useEditor, useEditorState, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import classNames from 'classnames'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
    ArrowUp,
    Bold,
    Italic,
    Link as LinkIcon,
    List,
    NumberList,
    Redo,
    RemoveFormating,
    Undo,
} from '@open-condo/icons'

import { Button } from '../Button'
import { Tooltip } from '../Tooltip'

import type { Editor } from '@tiptap/react'
import type { CSSProperties } from 'react'

const RICH_TEXT_AREA_CLASS_PREFIX = 'condo-rich-text-area'

export type RichTextAreaToolbarLabels = {
    undo: string
    redo: string
    link: string
    bold: string
    italic: string
    unorderedList: string
    orderedList: string
    removeFormating: string
}

const DEFAULT_TOOLBAR_LABELS: RichTextAreaToolbarLabels = {
    undo: 'Undo',
    redo: 'Redo',
    link: 'Link',
    bold: 'Bold',
    italic: 'Italic',
    unorderedList: 'Unordered List',
    orderedList: 'Ordered List',
    removeFormating: 'Remove Formatting',
}

export type RichTextAreaProps = {
    value?: string
    onChange?: (value: string) => void
    onSubmit?: (value: string) => void
    isSubmitDisabled?: boolean
    disabled?: boolean
    maxLength?: number
    showCount?: boolean
    placeholder?: string
    autoSize?: boolean | { minRows?: number, maxRows?: number }
    overflowPolicy?: 'crop' | 'show'
    toolbarLabels?: Partial<RichTextAreaToolbarLabels>
    bottomPanelUtils?: React.ReactElement[]
}

type ToolbarProps = {
    editor: Editor | null
    labels: RichTextAreaToolbarLabels
    disabled?: boolean
}

const ToolbarButton: React.FC<{
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    title: string
    icon: React.ReactNode
}> = ({ onClick, isActive, disabled, title, icon }) => {
    const handleClick = useCallback(() => {
        if (!disabled) onClick()
    }, [disabled, onClick])

    return (
        <Tooltip title={title} mouseEnterDelay={1} mouseLeaveDelay={0}>
            <Button
                type='secondary'
                minimal
                size='medium'
                icon={icon}
                onClick={handleClick}
                className={classNames(`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-button`, {
                    [`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-button-active`]: isActive,
                    [`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-button-disabled`]: disabled,
                })}
            />
        </Tooltip>
    )
}

const ToolbarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className={`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-group`}>
        {children}
    </span>
)

const Toolbar: React.FC<ToolbarProps> = ({ editor, labels, disabled }) => {
    const activeStates = useEditorState({
        editor,
        selector: ({ editor: e }) => {
            if (!e) return null
            return {
                bold: e.isActive('bold'),
                italic: e.isActive('italic'),
                bulletList: e.isActive('bulletList'),
                orderedList: e.isActive('orderedList'),
                link: e.isActive('link'),
                canUndo: e.can().undo(),
                canRedo: e.can().redo(),
            }
        },
    })

    const handleLink = useCallback(() => {
        if (!editor) return
        if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run()
            return
        }
        // eslint-disable-next-line no-alert
        const url = window.prompt('URL')
        if (url) {
            editor.chain().focus().setLink({ href: url }).run()
        }
    }, [editor])

    const handleRemoveFormating = useCallback(() => {
        if (!editor) return
        editor.chain().focus().clearNodes().unsetAllMarks().run()
    }, [editor])

    if (!editor || !activeStates) return null

    return (
        <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar`}>
            <ToolbarGroup>
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={disabled || !activeStates.canUndo}
                    title={labels.undo}
                    icon={<Undo size='small' />}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={disabled || !activeStates.canRedo}
                    title={labels.redo}
                    icon={<Redo size='small' />}
                />
            </ToolbarGroup>

            <ToolbarGroup>
                <ToolbarButton
                    onClick={handleLink}
                    isActive={activeStates.link}
                    disabled={disabled}
                    title={labels.link}
                    icon={<LinkIcon size='small' />}
                />
            </ToolbarGroup>

            <ToolbarGroup>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={activeStates.bold}
                    disabled={disabled}
                    title={labels.bold}
                    icon={<Bold size='small' />}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={activeStates.italic}
                    disabled={disabled}
                    title={labels.italic}
                    icon={<Italic size='small' />}
                />
            </ToolbarGroup>

            <ToolbarGroup>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={activeStates.bulletList}
                    disabled={disabled}
                    title={labels.unorderedList}
                    icon={<List size='small' />}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={activeStates.orderedList}
                    disabled={disabled}
                    title={labels.orderedList}
                    icon={<NumberList size='small' />}
                />
            </ToolbarGroup>

            <ToolbarGroup>
                <ToolbarButton
                    onClick={handleRemoveFormating}
                    disabled={disabled}
                    title={labels.removeFormating}
                    icon={<RemoveFormating size='small' />}
                />
            </ToolbarGroup>
        </div>
    )
}

const EDITOR_VERTICAL_PADDING = 24 // 12px top + 12px bottom
const DEFAULT_LINE_HEIGHT = 24

export const RichTextArea: React.FC<RichTextAreaProps> = ({
    value,
    placeholder,
    onChange,
    onSubmit,
    isSubmitDisabled,
    disabled,
    maxLength = 1000,
    showCount = true,
    autoSize = { minRows: 1 },
    overflowPolicy = 'crop',
    toolbarLabels,
    bottomPanelUtils = [],
}) => {
    const labels = useMemo(() => ({
        ...DEFAULT_TOOLBAR_LABELS,
        ...toolbarLabels,
    }), [toolbarLabels])

    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    const maxLengthRef = useRef(maxLength)
    maxLengthRef.current = maxLength

    const overflowPolicyRef = useRef(overflowPolicy)
    overflowPolicyRef.current = overflowPolicy

    // Parse autoSize config
    const autoSizeConfig = useMemo(() => {
        if (typeof autoSize === 'boolean' || !autoSize) return { minRows: 1 }
        return autoSize
    }, [autoSize])

    // Measure actual line-height from editor DOM for accurate row calculation
    const editorWrapRef = useRef<HTMLDivElement>(null)
    const [measuredLineHeight, setMeasuredLineHeight] = useState<number | null>(null)
    const lineHeight = measuredLineHeight || DEFAULT_LINE_HEIGHT

    const [markdownLength, setMarkdownLength] = useState(0)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3, 4, 5, 6],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            }),
            Image,
            Table,
            TableRow,
            TableCell,
            TableHeader,
            Markdown,
        ],
        editable: !disabled,
        content: value || '',
        ...(value ? { contentType: 'markdown' as const } : {}),
        onUpdate: ({ editor: updatedEditor }) => {
            const md = updatedEditor.getMarkdown()

            const textLength = updatedEditor.getText({ blockSeparator: '\n' }).length

            if (overflowPolicyRef.current === 'crop' && md.length > maxLengthRef.current) {
                const croppedMd = md.slice(0, maxLengthRef.current)
                updatedEditor.commands.setContent(croppedMd, { contentType: 'markdown' })
                setMarkdownLength(updatedEditor.getText({ blockSeparator: '\n' }).length)
                onChangeRef.current?.(croppedMd)
                return
            }

            setMarkdownLength(textLength)
            onChangeRef.current?.(md)
        },
    })

    // Sync editable state with disabled prop
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled)
        }
    }, [editor, disabled])

    // Sync external value changes
    const isExternalUpdate = useRef(false)
    useEffect(() => {
        if (editor && value !== undefined) {
            const currentMd = editor.getMarkdown()
            if (currentMd !== value) {
                isExternalUpdate.current = true
                editor.commands.setContent(value || '', value ? { contentType: 'markdown' } : {})
                setMarkdownLength(editor.getText({ blockSeparator: '\n' }).length)
                isExternalUpdate.current = false
            }
        }
    }, [editor, value])

    // Update text length on mount and measure line-height
    useEffect(() => {
        if (editor) {
            setMarkdownLength(editor.getText({ blockSeparator: '\n' }).length)

            // Measure actual line-height from rendered editor
            const el = editorWrapRef.current?.querySelector('.tiptap')
            if (el) {
                const lh = parseFloat(window.getComputedStyle(el).lineHeight)
                if (!isNaN(lh) && lh > 0) setMeasuredLineHeight(lh)
            }
        }
    }, [editor])

    const handleSubmit = useCallback(() => {
        if (!editor || !onSubmit) return
        const md = editor.getMarkdown()
        onSubmit(md)
    }, [editor, onSubmit])

    const currentLength = editor ? markdownLength : (value || '').length

    // Calculate min/max height from rows and measured line-height
    const style = useMemo(() => {
        const minRows = autoSizeConfig.minRows || 1
        const minH = minRows * lineHeight + EDITOR_VERTICAL_PADDING
        const maxH = autoSizeConfig.maxRows
            ? autoSizeConfig.maxRows * lineHeight + EDITOR_VERTICAL_PADDING
            : undefined
        return {
            '--rta-min-height': `${minH}px`,
            '--rta-max-height': maxH ? `${maxH}px` : 'none',
        } as CSSProperties
    }, [autoSizeConfig, lineHeight])

    const countClassName = classNames('condo-input-count', {
        [`${RICH_TEXT_AREA_CLASS_PREFIX}-count-overflow`]: currentLength > maxLength,
    })

    const editorIsEmpty = useEditorState({
        editor,
        selector: ({ editor: e }) => e?.isEmpty ?? true,
    })

    const containerClassName = classNames(RICH_TEXT_AREA_CLASS_PREFIX, {
        [`${RICH_TEXT_AREA_CLASS_PREFIX}-disabled`]: disabled,
    })

    const hasBottomPanelUtils = bottomPanelUtils.length > 0
    const shouldShowRightPanel = showCount || onSubmit
    const showBottomPanel = hasBottomPanelUtils || shouldShowRightPanel

    return (
        <div className={containerClassName} style={style}>
            <Toolbar editor={editor} labels={labels} disabled={disabled} />
            <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-editor-wrap`} ref={editorWrapRef}>
                <EditorContent editor={editor} />
                {editorIsEmpty && placeholder && (
                    <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-placeholder`}>
                        {placeholder}
                    </div>
                )}
            </div>
            {showBottomPanel && (
                <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-bottom-panel`}>
                    <span className='condo-input-bottom-panel'>
                        {hasBottomPanelUtils && (
                            <span className='condo-input-utils'>
                                {bottomPanelUtils.map((util, index) => (
                                    <React.Fragment key={index}>
                                        {React.cloneElement(util, { disabled: util.props.disabled || disabled })}
                                    </React.Fragment>
                                ))}
                            </span>
                        )}

                        {shouldShowRightPanel && (
                            <span className='condo-input-bottom-panel-right'>
                                {showCount && (
                                    <span className={countClassName}>
                                        {currentLength}/{maxLength}
                                    </span>
                                )}

                                {onSubmit && (
                                    <Button
                                        disabled={disabled || isSubmitDisabled}
                                        type='accent'
                                        size='medium'
                                        onClick={handleSubmit}
                                        icon={<ArrowUp size='small' />}
                                    />
                                )}
                            </span>
                        )}
                    </span>
                </div>
            )}
        </div>
    )
}

RichTextArea.displayName = 'RichTextArea'
