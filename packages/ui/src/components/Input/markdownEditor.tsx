import classNames from 'classnames'
import EasyMDE from 'easymde'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SimpleMDE from 'react-simplemde-editor'

import type { CSSProperties } from 'react'
import type { SimpleMDEReactProps } from 'react-simplemde-editor'

const MARKDOWN_EDITOR_CLASS_PREFIX = 'condo-markdown-editor'

const DEFAULT_GUIDE_URL = 'https://www.markdownguide.org/basic-syntax'

export type ToolbarLabels = {
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
    guide: string
}

const DEFAULT_TOOLBAR_LABELS: ToolbarLabels = {
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
    guide: 'Markdown Guide',
}

export type MarkdownEditorProps = {
    value?: string
    onChange?: (value: string) => void
    maxLength?: number
    placeholder?: string
    minHeight?: string
    maxHeight?: string
    overflowPolicy?: 'crop' | 'show'
    guideUrl?: string
    toolbarLabels?: Partial<ToolbarLabels>
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    placeholder,
    onChange,
    maxLength = 1000,
    minHeight = '200px',
    maxHeight = '400px',
    overflowPolicy = 'crop',
    guideUrl = DEFAULT_GUIDE_URL,
    toolbarLabels,
}) => {
    const labels = useMemo(() => ({
        ...DEFAULT_TOOLBAR_LABELS,
        ...toolbarLabels,
    }), [toolbarLabels])

    const [internalValue, setInternalValue] = useState(() => value || '')
    const editorInstanceRef = useRef<EasyMDE | null>(null)

    const getMdeInstance = useCallback((instance: EasyMDE) => {
        editorInstanceRef.current = instance
    }, [])

    const handleValueChange = useCallback((value: string) => {
        let cleanedValue = value
        const cm = editorInstanceRef.current?.codemirror
        if (overflowPolicy === 'crop' && cleanedValue.length > maxLength) {
            cleanedValue = cleanedValue.slice(0, maxLength)
            if (cm) {
                const cursor = cm.getCursor()
                const lines = cleanedValue.split('\n')
                const line = Math.min(cursor.line, lines.length - 1)
                const ch = Math.min(cursor.ch, lines[line].length)
                cm.setValue(cleanedValue)
                cm.setCursor({ line, ch })
            }
        }
        setInternalValue(cleanedValue)

        return cleanedValue
    }, [maxLength, overflowPolicy])

    const internalOnChange = useCallback((value: string) => {
        const cleanedValue = handleValueChange(value)
        onChange?.(cleanedValue)
    }, [handleValueChange, onChange])

    useEffect(() => {
        if (value !== undefined) {
            handleValueChange(value || '')
        }
    }, [handleValueChange, value])

    const options: SimpleMDEReactProps['options'] = useMemo(() => {
        const toolbar: Required<SimpleMDEReactProps>['options']['toolbar'] = [
            {
                name: 'undo',
                title: labels.undo,
                action: EasyMDE.undo,
                className: 'fa fa-undo',
            },
            {
                name: 'redo',
                title: labels.redo,
                action: EasyMDE.redo,
                className: 'fa fa-repeat',
            },
            '|',
            {
                name: 'bold',
                title: labels.bold,
                action: EasyMDE.toggleBold,
                className: 'fa fa-bold',
            },
            {
                name: 'italic',
                title: labels.italic,
                action: EasyMDE.toggleItalic,
                className: 'fa fa-italic',
            },
            {
                name: 'heading-2',
                title: labels.heading,
                action: EasyMDE.toggleHeading2,
                className: 'fa fa-header',
            },
            '|',
            {
                name: 'quote',
                title: labels.quote,
                action: EasyMDE.toggleBlockquote,
                className: 'fa fa-quote-left',
            },
            {
                name: 'unordered-list',
                title: labels.unorderedList,
                action: EasyMDE.toggleUnorderedList,
                className: 'fa fa-list-ul',
            },
            {
                name: 'ordered-list',
                title: labels.orderedList,
                action: EasyMDE.toggleOrderedList,
                className: 'fa fa-list-ol',
            },
            '|',
            {
                name: 'link',
                title: labels.link,
                action: EasyMDE.drawLink,
                className: 'fa fa-link',
            },
            {
                name: 'image',
                title: labels.image,
                action: EasyMDE.drawImage,
                className: 'fa fa-picture-o',
            },
            {
                name: 'table',
                title: labels.table,
                action: EasyMDE.drawTable,
                className: 'fa fa-table',
            },
            '|',
            {
                name: 'guide',
                title: labels.guide,
                action: guideUrl,
                className: 'fa fa-question-circle',
            },
        ]

        return {
            toolbar,
            status: false,
            spellChecker: false,
            sideBySideFullscreen: true,
            // NOTE: maxHeight should not be set as it sets fixed size instead of max-height:
            // https://github.com/Ionaru/easy-markdown-editor/blob/2996b67ec95ec69000ee03ccaee4fcca26cfc701/README.md?plain=1#L147
            minHeight,
        }
    }, [labels, guideUrl, minHeight])

    const style = useMemo(() => ({ '--md-editor-max-height': maxHeight } as CSSProperties), [maxHeight])

    const countClassName = classNames('condo-input-count', {
        [`${MARKDOWN_EDITOR_CLASS_PREFIX}-count-overflow`]: internalValue.length > maxLength,
    })

    return (
        <div className={MARKDOWN_EDITOR_CLASS_PREFIX} data-max-height={maxHeight}>
            <SimpleMDE
                placeholder={placeholder}
                value={internalValue}
                onChange={internalOnChange}
                options={options}
                style={style}
                getMdeInstance={getMdeInstance}
            />
            <div className={`${MARKDOWN_EDITOR_CLASS_PREFIX}-bottom-panel`}>
                <span className='condo-input-bottom-panel'>
                    <span className='condo-input-bottom-panel-right'>
                        <span className={countClassName}>
                            {internalValue.length}/{maxLength}
                        </span>
                    </span>
                </span>
            </div>
        </div>
    )
}

MarkdownEditor.displayName = 'MarkdownEditor'

export function replaceHeaders (text: string, minLevel = 1, maxLevel = 6) {
    return text.replace(/^(#{1,6})(?=$|\s)/gm, (match) => {
        const clampedLevel = Math.min(Math.max(match.length, minLevel), maxLevel)
        return '#'.repeat(clampedLevel)
    })
}
