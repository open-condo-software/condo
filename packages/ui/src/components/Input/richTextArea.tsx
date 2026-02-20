import { Blockquote } from '@tiptap/extension-blockquote'
import { CharacterCount } from '@tiptap/extension-character-count'
import { CodeBlock } from '@tiptap/extension-code-block'
import { Heading } from '@tiptap/extension-heading'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { TaskItem, TaskList } from '@tiptap/extension-list'
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
    CheckSquare,
    Italic,
    Link as LinkIcon,
    List,
    Newspaper,
    NumberList,
    Paperclip,
    Redo,
    RemoveFormating,
    Sheet,
    Slash,
    Subtitles,
    Undo,
} from '@open-condo/icons'

import { Input as TextInput } from './input'

import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { Modal } from '../Modal'
import { Tooltip } from '../Tooltip'
import { Typography } from '../Typography'

import type { ReactNodeViewProps, Editor } from '@tiptap/react'
import type { CSSProperties } from 'react'


type RenderType = 'default' | 'inline'

type NodeConfig = {
    component: React.ComponentType<any>
    props?: Record<string, any>
    getProps?: (attrs: Record<string, any>) => Record<string, any>
}

// NOTE: If you change this config, make sure to update MARKDOWN_COMPONENTS_BY_TYPE
// in packages/ui/src/components/Markdown/markdown.tsx accordingly
const RICH_TEXT_AREA_COMPONENTS_BY_TYPE: Record<RenderType, Record<string, NodeConfig>> = {
    default: {
        heading: {
            component: Typography.Title,
            getProps: (attrs) => ({ level: attrs.level }),
        },
    },
    inline: {
        heading: {
            component: Typography.Paragraph,
            props: { strong: true, type: 'primary' },
        },
    },
}

const RICH_TEXT_AREA_CLASS_PREFIX = 'condo-rich-text-area'

const RichTextTypeContext = React.createContext<RenderType>('default')

// TipTap types NodeViewContent.as as NoInfer<'div'>, which is overly restrictive.
// Re-type once so all usages stay cast-free.
const TypedNodeViewContent = NodeViewContent as React.FC<{ as?: keyof JSX.IntrinsicElements }>

type NodeViewOptions = {
    configKey?: string
    fallbackTag: keyof JSX.IntrinsicElements
    contentTag?: keyof JSX.IntrinsicElements
}

function createNodeView ({ configKey, fallbackTag, contentTag }: NodeViewOptions): React.FC<ReactNodeViewProps> {
    const resolvedContentTag = contentTag || 'span'
    const resolvedFallbackTag = fallbackTag

    const View: React.FC<ReactNodeViewProps> = ({ node }) => {
        const type = useContext(RichTextTypeContext)
        const config = configKey ? RICH_TEXT_AREA_COMPONENTS_BY_TYPE[type]?.[configKey] : null

        if (config) {
            const Component = config.component
            const props = {
                ...config.props,
                ...(config.getProps ? config.getProps(node.attrs) : {}),
            }
            return (
                <NodeViewWrapper>
                    <Component {...props}>
                        <TypedNodeViewContent as={resolvedContentTag} />
                    </Component>
                </NodeViewWrapper>
            )
        }

        return (
            <NodeViewWrapper as={resolvedFallbackTag}>
                <TypedNodeViewContent as={resolvedContentTag} />
            </NodeViewWrapper>
        )
    }
    View.displayName = `NodeView(${configKey || fallbackTag})`
    return View
}

const HeadingNodeView = createNodeView({ configKey: 'heading', fallbackTag: 'h2' })
const CodeBlockNodeView = createNodeView({ fallbackTag: 'pre', contentTag: 'code' })
const BlockquoteNodeView = createNodeView({ fallbackTag: 'blockquote' })

const TaskItemNodeView: React.FC<ReactNodeViewProps> = ({ node, updateAttributes }) => {
    const checked = node.attrs.checked || false

    const handleChange = useCallback(() => {
        updateAttributes({ checked: !checked })
    }, [checked, updateAttributes])

    return (
        <NodeViewWrapper as='li' data-checked={String(checked)}>
            <span contentEditable={false}>
                <Checkbox checked={checked} onChange={handleChange} />
            </span>
            <TypedNodeViewContent as='div' />
        </NodeViewWrapper>
    )
}
TaskItemNodeView.displayName = 'TaskItemNodeView'

function sanitizeMarkdown (md: string): string {
    return md.replaceAll('&nbsp;', ' ').replaceAll('\u00A0', ' ')
}

type RichTextAreaToolbarLabels = {
    undo: string
    redo: string
    link: string
    bold: string
    italic: string
    strikethrough: string
    unorderedList: string
    orderedList: string
    taskList: string
    removeFormating: string
    table: string
    blockquote: string
    image: string
    heading: string
}

type RichTextAreaLinkModalLabels = {
    urlLabel: string
    textLabel: string
    submitLabel: string
}

type RichTextAreaImageModalLabels = {
    urlLabel: string
    submitLabel: string
}

export type RichTextAreaCustomLabels = {
    toolbar?: Partial<RichTextAreaToolbarLabels>
    linkModal?: Partial<RichTextAreaLinkModalLabels>
    imageModal?: Partial<RichTextAreaImageModalLabels>
}

type ToolbarButtonKey =
    | 'undo' | 'redo'
    | 'bold' | 'italic' | 'strikethrough'
    | 'link'
    | 'unorderedList' | 'orderedList' | 'taskList'
    | 'removeFormating'
    | 'table' | 'blockquote' | 'image' | 'heading'

export type ToolbarGroup = ToolbarButtonKey[]

const DEFAULT_TOOLBAR_LABELS: RichTextAreaToolbarLabels = {
    undo: 'Undo',
    redo: 'Redo',
    link: 'Link',
    bold: 'Bold',
    italic: 'Italic',
    strikethrough: 'Strikethrough',
    unorderedList: 'Unordered List',
    orderedList: 'Ordered List',
    taskList: 'Task List',
    removeFormating: 'Remove Formatting',
    table: 'Table',
    blockquote: 'Blockquote',
    image: 'Image',
    heading: 'Heading',
}

const DEFAULT_LINK_MODAL_LABELS: RichTextAreaLinkModalLabels = {
    urlLabel: 'Link',
    textLabel: 'Text',
    submitLabel: 'Ok',
}

const DEFAULT_IMAGE_MODAL_LABELS: RichTextAreaImageModalLabels = {
    urlLabel: 'Image URL',
    submitLabel: 'Ok',
}

type ToolbarHelpers = {
    openLinkModal: () => void
    openImageModal: () => void
}

type BuiltinButtonConfig = {
    icon: React.ReactNode
    labelKey: keyof RichTextAreaToolbarLabels
    action: (editor: Editor, helpers: ToolbarHelpers) => void
    isActive?: (editor: Editor) => boolean
    isDisabled?: (editor: Editor) => boolean
}

const BUILTIN_BUTTON_CONFIG: Record<ToolbarButtonKey, BuiltinButtonConfig> = {
    undo: {
        icon: <Undo size='small' />,
        labelKey: 'undo',
        action: (editor) => editor.chain().focus().undo().run(),
        isDisabled: (editor) => !editor.can().undo(),
    },
    redo: {
        icon: <Redo size='small' />,
        labelKey: 'redo',
        action: (editor) => editor.chain().focus().redo().run(),
        isDisabled: (editor) => !editor.can().redo(),
    },
    bold: {
        icon: <Bold size='small' />,
        labelKey: 'bold',
        action: (editor) => editor.chain().focus().toggleBold().run(),
        isActive: (editor) => editor.isActive('bold'),
    },
    italic: {
        icon: <Italic size='small' />,
        labelKey: 'italic',
        action: (editor) => editor.chain().focus().toggleItalic().run(),
        isActive: (editor) => editor.isActive('italic'),
    },
    strikethrough: {
        icon: <Slash size='small' />,
        labelKey: 'strikethrough',
        action: (editor) => editor.chain().focus().toggleStrike().run(),
        isActive: (editor) => editor.isActive('strike'),
    },
    link: {
        icon: <LinkIcon size='small' />,
        labelKey: 'link',
        action: (_editor, helpers) => helpers.openLinkModal(),
        isActive: (editor) => editor.isActive('link'),
    },
    unorderedList: {
        icon: <List size='small' />,
        labelKey: 'unorderedList',
        action: (editor) => editor.chain().focus().toggleBulletList().run(),
        isActive: (editor) => editor.isActive('bulletList'),
    },
    orderedList: {
        icon: <NumberList size='small' />,
        labelKey: 'orderedList',
        action: (editor) => editor.chain().focus().toggleOrderedList().run(),
        isActive: (editor) => editor.isActive('orderedList'),
    },
    taskList: {
        icon: <CheckSquare size='small' />,
        labelKey: 'taskList',
        action: (editor) => editor.chain().focus().toggleTaskList().run(),
        isActive: (editor) => editor.isActive('taskList'),
    },
    removeFormating: {
        icon: <RemoveFormating size='small' />,
        labelKey: 'removeFormating',
        action: (editor) => editor.chain().focus().clearNodes().unsetAllMarks().run(),
    },
    table: {
        icon: <Sheet size='small' />,
        labelKey: 'table',
        action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    blockquote: {
        icon: <Newspaper size='small' />,
        labelKey: 'blockquote',
        action: (editor) => editor.chain().focus().toggleBlockquote().run(),
        isActive: (editor) => editor.isActive('blockquote'),
    },
    image: {
        icon: <Paperclip size='small' />,
        labelKey: 'image',
        action: (_editor, helpers) => helpers.openImageModal(),
    },
    heading: {
        icon: <Subtitles size='small' />,
        labelKey: 'heading',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: (editor) => editor.isActive('heading', { level: 2 }),
    },
}

const DEFAULT_TOOLBAR_GROUPS: ToolbarGroup[] = [
    ['undo', 'redo'],
    ['link'],
    ['bold', 'italic'],
    ['unorderedList', 'orderedList'],
    ['removeFormating'],
]

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

const ToolbarButtonGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className={`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar-group`}>
        {children}
    </span>
)

type ToolbarModalProps = {
    open: boolean
    onCancel: () => void
    onSubmit: () => void
    submitLabel: string
    children: React.ReactNode
}

const ToolbarModal: React.FC<ToolbarModalProps> = ({
    open,
    onCancel,
    onSubmit,
    submitLabel,
    children,
}) => {
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit()
        }
    }, [onSubmit])

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            width='small'
            scrollX={false}
            destroyOnClose
            className={`${RICH_TEXT_AREA_CLASS_PREFIX}-link-modal`}
            footer={(
                <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-link-modal-footer`}>
                    <Button type='primary' onClick={onSubmit}>
                        {submitLabel}
                    </Button>
                </div>
            )}
        >
            <div
                className={`${RICH_TEXT_AREA_CLASS_PREFIX}-link-modal-content`}
                onKeyDown={handleKeyDown}
            >
                {children}
            </div>
        </Modal>
    )
}

const ModalField: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-link-modal-field`}>
        <Typography.Text type='secondary' size='medium'>
            {label}
        </Typography.Text>
        {children}
    </div>
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

    return (
        <ToolbarModal open={open} onCancel={onCancel} onSubmit={handleSubmit} submitLabel={labels.submitLabel}>
            <ModalField label={labels.urlLabel}>
                <TextInput
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder='https://'
                />
            </ModalField>
            <ModalField label={labels.textLabel}>
                <TextInput
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </ModalField>
        </ToolbarModal>
    )
}

type ImageModalProps = {
    open: boolean
    onCancel: () => void
    onSubmit: (url: string) => void
    labels: RichTextAreaImageModalLabels
}

const ImageModal: React.FC<ImageModalProps> = ({
    open,
    onCancel,
    onSubmit,
    labels,
}) => {
    const [url, setUrl] = useState('')

    useEffect(() => {
        if (open) {
            setUrl('')
        }
    }, [open])

    const handleSubmit = useCallback(() => {
        onSubmit(url)
    }, [url, onSubmit])

    return (
        <ToolbarModal open={open} onCancel={onCancel} onSubmit={handleSubmit} submitLabel={labels.submitLabel}>
            <ModalField label={labels.urlLabel}>
                <TextInput
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder='https://'
                />
            </ModalField>
        </ToolbarModal>
    )
}

type ToolbarProps = {
    editor: Editor | null
    labels: RichTextAreaToolbarLabels
    linkModalLabels: RichTextAreaLinkModalLabels
    imageModalLabels: RichTextAreaImageModalLabels
    groups: ToolbarGroup[]
    disabled?: boolean
}

const makeTextContent = (text: string, url?: string) => {
    if (url) {
        return { type: 'text', text, marks: [{ type: 'link', attrs: { href: url } }] }
    }
    return { type: 'text', text }
}

const Toolbar: React.FC<ToolbarProps> = ({ editor, labels, linkModalLabels, imageModalLabels, groups, disabled }) => {
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const [linkModalInitialUrl, setLinkModalInitialUrl] = useState('')
    const [linkModalInitialText, setLinkModalInitialText] = useState('')
    const [imageModalOpen, setImageModalOpen] = useState(false)

    const hasLink = useMemo(
        () => groups.some(group => group.includes('link')),
        [groups],
    )

    const hasImage = useMemo(
        () => groups.some(group => group.includes('image')),
        [groups],
    )

    const buttonStates = useEditorState({
        editor,
        selector: ({ editor: e }) => {
            if (!e) return null
            const states: Record<string, { isActive: boolean, isDisabled: boolean }> = {}
            for (const group of groups) {
                for (const item of group) {
                    const config = BUILTIN_BUTTON_CONFIG[item]
                    states[item] = {
                        isActive: config.isActive?.(e) ?? false,
                        isDisabled: config.isDisabled?.(e) ?? false,
                    }
                }
            }
            return states
        },
    })

    const handleLink = useCallback(() => {
        if (!editor) return

        const href = editor.getAttributes('link')?.href
        const existingUrl = typeof href === 'string' ? href : ''

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

        const trimmedUrl = url.trim() || undefined

        if (hasSelection) {
            const selectedText = editor.state.doc.textBetween(from, to, '')
            if (text && text !== selectedText) {
                editor.chain().focus().deleteSelection()
                    .insertContent(makeTextContent(text, trimmedUrl)).run()
            } else if (trimmedUrl) {
                editor.chain().focus().setLink({ href: trimmedUrl }).run()
            } else {
                editor.chain().focus().unsetLink().run()
            }
        } else if (!trimmedUrl && editor.isActive('link')) {
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

    const handleImage = useCallback(() => {
        setImageModalOpen(true)
    }, [])

    const handleImageModalSubmit = useCallback((url: string) => {
        if (!editor) return
        setImageModalOpen(false)
        if (url.trim()) {
            editor.chain().focus().setImage({ src: url.trim() }).run()
        } else {
            editor.chain().focus().run()
        }
    }, [editor])

    const handleImageModalCancel = useCallback(() => {
        setImageModalOpen(false)
        editor?.chain().focus().run()
    }, [editor])

    const helpers: ToolbarHelpers = useMemo(() => ({
        openLinkModal: handleLink,
        openImageModal: handleImage,
    }), [handleLink, handleImage])

    if (!editor) return null

    return (
        <>
            <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-toolbar`}>
                {groups.map((group, groupIndex) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <ToolbarButtonGroup key={groupIndex}>
                        {group.map((item) => {
                            const config = BUILTIN_BUTTON_CONFIG[item]
                            const state = buttonStates?.[item]
                            return (
                                <ToolbarButton
                                    key={item}
                                    onClick={() => config.action(editor, helpers)}
                                    isActive={state?.isActive}
                                    disabled={disabled || state?.isDisabled}
                                    title={labels[config.labelKey]}
                                    icon={config.icon}
                                />
                            )
                        })}
                    </ToolbarButtonGroup>
                ))}
            </div>
            {/* NOTE: conditional render required — condo Modal can't close visually via open prop */}
            {hasLink && linkModalOpen && (
                <LinkModal
                    open={linkModalOpen}
                    onCancel={handleLinkModalCancel}
                    onSubmit={handleLinkModalSubmit}
                    initialUrl={linkModalInitialUrl}
                    initialText={linkModalInitialText}
                    labels={linkModalLabels}
                />
            )}
            {hasImage && imageModalOpen && (
                <ImageModal
                    open={imageModalOpen}
                    onCancel={handleImageModalCancel}
                    onSubmit={handleImageModalSubmit}
                    labels={imageModalLabels}
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
    toolbarGroups?: ToolbarGroup[]
    customLabels?: RichTextAreaCustomLabels
    bottomPanelUtils?: React.ReactElement[]
    type?: RenderType
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
    toolbarGroups = DEFAULT_TOOLBAR_GROUPS,
    customLabels,
    bottomPanelUtils = [],
    type = 'default',
}) => {
    const resolvedToolbarLabels = useMemo(() => ({
        ...DEFAULT_TOOLBAR_LABELS,
        ...customLabels?.toolbar,
    }), [customLabels?.toolbar])

    const resolvedLinkModalLabels = useMemo(() => ({
        ...DEFAULT_LINK_MODAL_LABELS,
        ...customLabels?.linkModal,
    }), [customLabels?.linkModal])

    const resolvedImageModalLabels = useMemo(() => ({
        ...DEFAULT_IMAGE_MODAL_LABELS,
        ...customLabels?.imageModal,
    }), [customLabels?.imageModal])

    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    // Parse autoSize config
    const autoSizeConfig = useMemo(() => {
        if (typeof autoSize === 'boolean' || !autoSize) return { minRows: 1 }
        return autoSize
    }, [autoSize])

    // Measure actual line-height from editor DOM for accurate row calculation
    const editorWrapRef = useRef<HTMLDivElement>(null)
    const [measuredLineHeight, setMeasuredLineHeight] = useState<number | null>(null)
    const lineHeight = measuredLineHeight || DEFAULT_LINE_HEIGHT

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                blockquote: false,
            }),
            Heading.extend({ addNodeView: () => ReactNodeViewRenderer(HeadingNodeView) })
                .configure({ levels: [1, 2, 3, 4, 5, 6] }),
            CodeBlock.extend({ addNodeView: () => ReactNodeViewRenderer(CodeBlockNodeView) }),
            Blockquote.extend({ addNodeView: () => ReactNodeViewRenderer(BlockquoteNodeView) }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            }),
            Image,
            TaskList,
            TaskItem.extend({ addNodeView: () => ReactNodeViewRenderer(TaskItemNodeView) })
                .configure({ nested: true }),
            Table,
            TableRow,
            TableCell,
            TableHeader,
            Markdown,
            Placeholder.configure({
                placeholder: placeholder || 'Placeholder',
                showOnlyCurrent: false,
            }),
            CharacterCount.configure({
                limit: overflowPolicy === 'crop' ? maxLength : null,
                mode: 'textSize',
            }),
        ],
        editable: !disabled,
        content: value || '',
        ...(value ? { contentType: 'markdown' as const } : {}),
        onUpdate: ({ editor: updatedEditor }) => {
            const md = sanitizeMarkdown(updatedEditor.getMarkdown())
            onChangeRef.current?.(md)
        },
    }, [placeholder])

    // Sync editable state with disabled prop
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled)
        }
    }, [editor, disabled])

    // Sync external value changes
    useEffect(() => {
        if (editor && value !== undefined) {
            const currentMd = sanitizeMarkdown(editor.getMarkdown())
            if (currentMd !== value) {
                editor.commands.setContent(value || '', value ? { contentType: 'markdown' } : {})
            }
        }
    }, [editor, value])

    // Measure line-height on mount
    useEffect(() => {
        if (editor) {
            // Measure actual line-height from rendered editor
            const el = editorWrapRef.current?.querySelector('.tiptap')
            if (el) {
                const lh = Number.parseFloat(window.getComputedStyle(el).lineHeight)
                if (!Number.isNaN(lh) && lh > 0) setMeasuredLineHeight(lh)
            }
        }
    }, [editor])

    const handleSubmit = useCallback(() => {
        if (!editor || !onSubmit) return
        const md = sanitizeMarkdown(editor.getMarkdown())
        onSubmit(md)
    }, [editor, onSubmit])

    const currentLength = useEditorState({
        editor,
        selector: ({ editor: e }) => e?.storage.characterCount?.characters() ?? 0,
    })

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

    const containerClassName = classNames(RICH_TEXT_AREA_CLASS_PREFIX, `${RICH_TEXT_AREA_CLASS_PREFIX}-type-${type}`, {
        [`${RICH_TEXT_AREA_CLASS_PREFIX}-disabled`]: disabled,
    })

    const hasBottomPanelUtils = bottomPanelUtils.length > 0
    const shouldShowRightPanel = showCount || onSubmit
    const showBottomPanel = hasBottomPanelUtils || shouldShowRightPanel

    return (
        <RichTextTypeContext.Provider value={type}>
            <div className={containerClassName} style={style}>
                <Toolbar editor={editor} labels={resolvedToolbarLabels} linkModalLabels={resolvedLinkModalLabels} imageModalLabels={resolvedImageModalLabels} groups={toolbarGroups} disabled={disabled} />
                <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-editor-wrap`} ref={editorWrapRef}>
                    <EditorContent editor={editor} />
                </div>
                {showBottomPanel && (
                    <div className={`${RICH_TEXT_AREA_CLASS_PREFIX}-bottom-panel`}>
                        <span className='condo-input-bottom-panel'>
                            {hasBottomPanelUtils && (
                                <span className='condo-input-utils'>
                                    {bottomPanelUtils.map((util, index) => (
                                        React.cloneElement(util, {
                                            key: util.key ?? index,
                                            disabled: util.props.disabled || disabled,
                                        })
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
