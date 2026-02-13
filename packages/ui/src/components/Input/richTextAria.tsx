import { Blockquote } from '@tiptap/extension-blockquote'
import { CodeBlock } from '@tiptap/extension-code-block'
import { Heading } from '@tiptap/extension-heading'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { ListItem } from '@tiptap/extension-list-item'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { Markdown } from '@tiptap/markdown'
import {
    EditorContent,
    NodeViewContent,
    NodeViewWrapper,
    ReactNodeViewRenderer,
    useEditor,
    useEditorState,
} from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import classNames from 'classnames'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

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

import { Input as TextInput } from './input'

import { Button } from '../Button'
import { NODE_CONFIG_BY_TYPE } from '../Markdown/nodeConfig'
import { Modal } from '../Modal'
import { Tooltip } from '../Tooltip'
import { Typography } from '../Typography'

import type { RenderType } from '../Markdown/nodeConfig'
import type { ReactNodeViewProps, Editor } from '@tiptap/react'
import type { CSSProperties } from 'react'


const RICH_TEXT_AREA_CLASS_PREFIX = 'condo-rich-text-area'

const RichTextTypeContext = React.createContext<RenderType>('default')

type NodeViewOptions<
    F extends keyof JSX.IntrinsicElements = 'div',
    C extends keyof JSX.IntrinsicElements = 'span',
> = {
    configKey?: string
    fallbackTag: F
    contentTag?: C
}

function createNodeView<
    F extends keyof JSX.IntrinsicElements,
    C extends keyof JSX.IntrinsicElements = 'span',
> ({ configKey, fallbackTag, contentTag }: NodeViewOptions<F, C>): React.FC<ReactNodeViewProps> {
    const resolvedContentTag = (contentTag || 'span') as string as 'div'
    const resolvedFallbackTag = fallbackTag as string as 'div'

    const View: React.FC<ReactNodeViewProps> = ({ node }) => {
        const type = useContext(RichTextTypeContext)
        const config = configKey ? NODE_CONFIG_BY_TYPE[type]?.[configKey] : null

        if (config) {
            const Component = config.component
            const props = {
                ...config.props,
                ...(config.getProps ? config.getProps(node.attrs) : {}),
            }
            return (
                <NodeViewWrapper>
                    <Component {...props}>
                        <NodeViewContent as={resolvedContentTag} />
                    </Component>
                </NodeViewWrapper>
            )
        }

        return (
            <NodeViewWrapper as={resolvedFallbackTag}>
                <NodeViewContent as={resolvedContentTag} />
            </NodeViewWrapper>
        )
    }
    View.displayName = `NodeView(${configKey || fallbackTag})`
    return View
}

const HeadingNodeView = createNodeView({ configKey: 'heading', fallbackTag: 'h2' })
const ParagraphNodeView = createNodeView({ configKey: 'paragraph', fallbackTag: 'p' })
const ListItemNodeView = createNodeView({ configKey: 'listItem', fallbackTag: 'li' })
const CodeBlockNodeView = createNodeView({ fallbackTag: 'pre', contentTag: 'code' })
const BlockquoteNodeView = createNodeView({ fallbackTag: 'blockquote' })


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

export type RichTextAreaLinkModalLabels = {
    urlLabel: string
    textLabel: string
    submitLabel: string
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

const DEFAULT_LINK_MODAL_LABELS: RichTextAreaLinkModalLabels = {
    urlLabel: 'Link',
    textLabel: 'Text',
    submitLabel: 'Ok',
}

const ToolbarButton: React.FC<{
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    title: string
    icon: React.ReactNode
}> = ({ onClick, isActive, disabled, title, icon }) => (
    <Tooltip title={title} mouseEnterDelay={1} mouseLeaveDelay={0}>
        <Button
            type='secondary'
            minimal
            size='medium'
            icon={icon}
            disabled={disabled}
            onClick={onClick}
            className={classNames(`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-button`, {
                [`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-button-active`]: isActive,
            })}
        />
    </Tooltip>
)

const ToolbarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className={`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-group`}>
        {children}
    </span>
)

type LinkModalProps = {
    open: boolean
    onCancel: () => void
    onSubmit: (url: string, text: string) => void
    initialUrl: string
    initialText: string
    labels: RichTextAreaLinkModalLabels
}

const LinkModal: React.FC<LinkModalProps> = ({
    open,
    onCancel,
    onSubmit,
    initialUrl,
    initialText,
    labels,
}) => {
    const [url, setUrl] = useState(initialUrl)
    const [text, setText] = useState(initialText)

    useEffect(() => {
        if (open) {
            setUrl(initialUrl)
            setText(initialText)
        }
    }, [open, initialUrl, initialText])

    const handleSubmit = useCallback(() => {
        onSubmit(url, text)
    }, [url, text, onSubmit])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        }
    }, [handleSubmit])

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            width='small'
            scrollX={false}
            destroyOnClose
            footer={(
                <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-link-modal-footer`}>
                    <Button type='primary' onClick={handleSubmit}>
                        {labels.submitLabel}
                    </Button>
                </div>
            )}
        >
            <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-link-modal-content`}>
                <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-link-modal-field`}>
                    <Typography.Text type='secondary' size='medium'>
                        {labels.urlLabel}
                    </Typography.Text>
                    <TextInput
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder='https://'
                    />
                </div>
                <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-link-modal-field`}>
                    <Typography.Text type='secondary' size='medium'>
                        {labels.textLabel}
                    </Typography.Text>
                    <TextInput
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>
        </Modal>
    )
}

type ToolbarProps = {
    editor: Editor | null
    labels: RichTextAreaToolbarLabels
    linkModalLabels: RichTextAreaLinkModalLabels
    disabled?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({ editor, labels, linkModalLabels, disabled }) => {
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const [linkModalInitialUrl, setLinkModalInitialUrl] = useState('')
    const [linkModalInitialText, setLinkModalInitialText] = useState('')

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

        // Get existing link URL (if cursor is on a link)
        const attrs = editor.getAttributes('link')
        const existingUrl = (attrs.href as string) || ''

        // Get selected text
        const { from, to } = editor.state.selection
        const selectedText = editor.state.doc.textBetween(from, to, '')

        setLinkModalInitialUrl(existingUrl)
        setLinkModalInitialText(selectedText)
        setLinkModalOpen(true)
    }, [editor])

    const handleLinkModalSubmit = useCallback((url: string, text: string) => {
        if (!editor) return

        setLinkModalOpen(false)

        const { from, to } = editor.state.selection
        const hasSelection = from !== to
        const hasUrl = Boolean(url.trim())

        const trimmedUrl = hasUrl ? url.trim() : undefined

        if (hasSelection) {
            const selectedText = editor.state.doc.textBetween(from, to, '')
            if (text && text !== selectedText) {
                editor.chain().focus().deleteSelection()
                    .insertContent(makeTextContent(text, trimmedUrl)).run()
            } else if (hasUrl) {
                editor.chain().focus().setLink({ href: url }).run()
            } else {
                editor.chain().focus().unsetLink().run()
            }
        } else if (!hasUrl && editor.isActive('link')) {
            editor.chain().focus().unsetLink().run()
        } else if (text) {
            editor.chain().focus().insertContent(makeTextContent(text, trimmedUrl)).run()
        } else {
            editor.chain().focus().run()
        }
    }, [editor])

    const handleLinkModalCancel = useCallback(() => {
        setLinkModalOpen(false)
        editor?.chain().focus().run()
    }, [editor])

    const handleRemoveFormating = useCallback(() => {
        if (!editor) return
        editor.chain().focus().clearNodes().unsetAllMarks().run()
    }, [editor])

    if (!editor || !activeStates) return null

    return (
        <>
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
            {/* NOTE: conditional render required — condo Modal can't close visually via open prop */}
            {linkModalOpen && (
                <LinkModal
                    open={linkModalOpen}
                    onCancel={handleLinkModalCancel}
                    onSubmit={handleLinkModalSubmit}
                    initialUrl={linkModalInitialUrl}
                    initialText={linkModalInitialText}
                    labels={linkModalLabels}
                />
            )}
        </>
    )
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
    linkModalLabels?: Partial<RichTextAreaLinkModalLabels>
    bottomPanelUtils?: React.ReactElement[]
    type?: RenderType
}

const getTextLength = (e: Editor) => e.getText({ blockSeparator: '\n' }).length

const makeTextContent = (text: string, url?: string) => {
    if (url) {
        return { type: 'text', text, marks: [{ type: 'link', attrs: { href: url } }] }
    }
    return { type: 'text', text }
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
    linkModalLabels: linkModalLabelsProp,
    bottomPanelUtils = [],
    type = 'default',
}) => {
    const labels = useMemo(() => ({
        ...DEFAULT_TOOLBAR_LABELS,
        ...toolbarLabels,
    }), [toolbarLabels])

    const resolvedLinkModalLabels = useMemo(() => ({
        ...DEFAULT_LINK_MODAL_LABELS,
        ...linkModalLabelsProp,
    }), [linkModalLabelsProp])

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
                heading: false,
                paragraph: false,
                codeBlock: false,
                blockquote: false,
                listItem: false,
            }),
            Heading.extend({ addNodeView: () => ReactNodeViewRenderer(HeadingNodeView) })
                .configure({ levels: [2, 3, 4, 5, 6] }),
            Paragraph.extend({ addNodeView: () => ReactNodeViewRenderer(ParagraphNodeView) }),
            CodeBlock.extend({ addNodeView: () => ReactNodeViewRenderer(CodeBlockNodeView) }),
            Blockquote.extend({ addNodeView: () => ReactNodeViewRenderer(BlockquoteNodeView) }),
            ListItem.extend({ addNodeView: () => ReactNodeViewRenderer(ListItemNodeView) }),
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
            Placeholder.configure({
                placeholder: placeholder || 'Placeholder',
                showOnlyCurrent: false,
            }),
        ],
        editable: !disabled,
        content: value || '',
        ...(value ? { contentType: 'markdown' as const } : {}),
        onUpdate: ({ editor: updatedEditor }) => {
            const md = updatedEditor.getMarkdown()

            const textLength = getTextLength(updatedEditor)

            if (overflowPolicyRef.current === 'crop' && md.length > maxLengthRef.current) {
                const croppedMd = md.slice(0, maxLengthRef.current)
                updatedEditor.commands.setContent(croppedMd, { contentType: 'markdown' })
                setMarkdownLength(getTextLength(updatedEditor))
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
    useEffect(() => {
        if (editor && value !== undefined) {
            const currentMd = editor.getMarkdown()
            if (currentMd !== value) {
                editor.commands.setContent(value || '', value ? { contentType: 'markdown' } : {})
                setMarkdownLength(getTextLength(editor))
            }
        }
    }, [editor, value])

    // Update text length on mount and measure line-height
    useEffect(() => {
        if (editor) {
            setMarkdownLength(getTextLength(editor))

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

    const containerClassName = classNames(RICH_TEXT_AREA_CLASS_PREFIX, {
        [`${RICH_TEXT_AREA_CLASS_PREFIX}-disabled`]: disabled,
    })

    const hasBottomPanelUtils = bottomPanelUtils.length > 0
    const shouldShowRightPanel = showCount || onSubmit
    const showBottomPanel = hasBottomPanelUtils || shouldShowRightPanel

    return (
        <RichTextTypeContext.Provider value={type}>
            <div className={containerClassName} style={style}>
                <Toolbar editor={editor} labels={labels} linkModalLabels={resolvedLinkModalLabels} disabled={disabled} />
                <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-editor-wrap`} ref={editorWrapRef}>
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
        </RichTextTypeContext.Provider>
    )
}

RichTextArea.displayName = 'RichTextArea'
