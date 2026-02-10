import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { Markdown } from '@tiptap/markdown'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import classNames from 'classnames'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import { ArrowUp } from '@open-condo/icons'

import { Button } from '../Button'

import type { Editor } from '@tiptap/react'
import type { CSSProperties } from 'react'

const RICH_TEXT_AREA_CLASS_PREFIX = 'condo-rich-text-area'

export type RichTextAreaToolbarLabels = {
    undo: string
    redo: string
    bold: string
    italic: string
    heading: string
    quote: string
    unorderedList: string
    orderedList: string
    link: string
    image: string
    table: string
}

const DEFAULT_TOOLBAR_LABELS: RichTextAreaToolbarLabels = {
    undo: 'Undo',
    redo: 'Redo',
    bold: 'Bold',
    italic: 'Italic',
    heading: 'Heading',
    quote: 'Quote',
    unorderedList: 'Unordered List',
    orderedList: 'Ordered List',
    link: 'Create Link',
    image: 'Insert Image',
    table: 'Insert Table',
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
    minHeight?: string
    maxHeight?: string
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
    children: React.ReactNode
}> = ({ onClick, isActive, disabled, title, children }) => (
    <button
        type='button'
        className={classNames(`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-button`, {
            [`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-button-active`]: isActive,
        })}
        onClick={onClick}
        disabled={disabled}
        title={title}
    >
        {children}
    </button>
)

const ToolbarSeparator: React.FC = () => (
    <span className={`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-separator`} />
)

const Toolbar: React.FC<ToolbarProps> = ({ editor, labels, disabled }) => {
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

    const handleImage = useCallback(() => {
        if (!editor) return
        // eslint-disable-next-line no-alert
        const url = window.prompt('Image URL')
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }, [editor])

    const handleTable = useCallback(() => {
        if (!editor) return
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }, [editor])

    if (!editor) return null

    return (
        <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar`}>
            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={disabled || !editor.can().undo()}
                title={labels.undo}
            >
                ↩
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={disabled || !editor.can().redo()}
                title={labels.redo}
            >
                ↪
            </ToolbarButton>

            <ToolbarSeparator />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                disabled={disabled}
                title={labels.bold}
            >
                B
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                disabled={disabled}
                title={labels.italic}
            >
                <em>I</em>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                disabled={disabled}
                title={labels.heading}
            >
                H2
            </ToolbarButton>

            <ToolbarSeparator />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                disabled={disabled}
                title={labels.quote}
            >
                &ldquo;
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                disabled={disabled}
                title={labels.unorderedList}
            >
                &bull;
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                disabled={disabled}
                title={labels.orderedList}
            >
                1.
            </ToolbarButton>

            <ToolbarSeparator />

            <ToolbarButton
                onClick={handleLink}
                isActive={editor.isActive('link')}
                disabled={disabled}
                title={labels.link}
            >
                🔗
            </ToolbarButton>
            <ToolbarButton
                onClick={handleImage}
                disabled={disabled}
                title={labels.image}
            >
                🖼
            </ToolbarButton>
            <ToolbarButton
                onClick={handleTable}
                isActive={editor.isActive('table')}
                disabled={disabled}
                title={labels.table}
            >
                ⊞
            </ToolbarButton>
        </div>
    )
}

export const RichTextArea: React.FC<RichTextAreaProps> = ({
    value,
    placeholder,
    onChange,
    onSubmit,
    isSubmitDisabled,
    disabled,
    maxLength = 1000,
    showCount = true,
    minHeight = '200px',
    maxHeight = '400px',
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

    const markdownLengthRef = useRef(0)

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
            Placeholder.configure({
                placeholder: placeholder || '',
            }),
            Markdown,
        ],
        editable: !disabled,
        content: value || '',
        contentType: 'markdown',
        onUpdate: ({ editor: updatedEditor }) => {
            const md = updatedEditor.getMarkdown()

            if (overflowPolicyRef.current === 'crop' && md.length > maxLengthRef.current) {
                const croppedMd = md.slice(0, maxLengthRef.current)
                updatedEditor.commands.setContent(croppedMd, { contentType: 'markdown' })
                markdownLengthRef.current = croppedMd.length
                onChangeRef.current?.(croppedMd)
                return
            }

            markdownLengthRef.current = md.length
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
                editor.commands.setContent(value || '', { contentType: 'markdown' })
                markdownLengthRef.current = (value || '').length
                isExternalUpdate.current = false
            }
        }
    }, [editor, value])

    // Update markdown length on mount
    useEffect(() => {
        if (editor) {
            markdownLengthRef.current = editor.getMarkdown().length
        }
    }, [editor])

    const handleSubmit = useCallback(() => {
        if (!editor || !onSubmit) return
        const md = editor.getMarkdown()
        onSubmit(md)
    }, [editor, onSubmit])

    const currentLength = editor ? markdownLengthRef.current : (value || '').length

    const style = useMemo(() => ({
        '--rta-min-height': minHeight,
        '--rta-max-height': maxHeight,
    } as CSSProperties), [minHeight, maxHeight])

    const countClassName = classNames('condo-input-count', {
        [`${RICH_TEXT_AREA_CLASS_PREFIX}-count-overflow`]: currentLength > maxLength,
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
            <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-editor-wrap`}>
                <EditorContent editor={editor} />
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
