import classNames from 'classnames'
import EasyMDE from 'easymde'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import SimpleMDE from 'react-simplemde-editor'

import styles from './editor.module.css'


import type { CSSProperties } from 'react'
import type { SimpleMDEReactProps } from 'react-simplemde-editor'

const { publicRuntimeConfig: { markdownGuideUrl } } = getConfig()

type MarkdownEditorProps = {
    value?: string
    onChange?: (value: string) => void
    maxLength?: number
    placeholder?: string
    minHeight?: string
    maxHeight?: string
    overflowPolicy?: 'crop' | 'show'
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    placeholder,
    onChange,
    maxLength = 1000,
    minHeight = '200px',
    maxHeight = '400px',
    overflowPolicy = 'crop',
}) => {
    const intl = useIntl()
    const UndoLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.undo.title' })
    const RedoLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.redo.title' })
    const BoldTextLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.bold.title' })
    const ItalicTextLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.italic.title' })
    const HeadingTextLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.heading2.title' })
    const QuoteTextLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.quote.title' })
    const UListLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.unorderedList.title' })
    const OListLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.orderedList.title' })
    const LinkLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.link.title' })
    const ImageLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.image.title' })
    const TableLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.table.title' })
    const MDGuideLabel = intl.formatMessage({ id: 'components.common.markdownEditor.controls.guide.title' })

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
                title: UndoLabel,
                action: EasyMDE.undo,
                className: 'fa fa-undo',
            },
            {
                name: 'redo',
                title: RedoLabel,
                action: EasyMDE.redo,
                className: 'fa fa-repeat',
            },
            '|',
            {
                name: 'bold',
                title: BoldTextLabel,
                action: EasyMDE.toggleBold,
                className: 'fa fa-bold',
            },
            {
                name: 'italic',
                title: ItalicTextLabel,
                action: EasyMDE.toggleItalic,
                className: 'fa fa-italic',
            },
            {
                name: 'heading-2',
                title: HeadingTextLabel,
                action: EasyMDE.toggleHeading2,
                className: 'fa fa-header',
            },
            '|',
            {
                name: 'quote',
                title: QuoteTextLabel,
                action: EasyMDE.toggleBlockquote,
                className: 'fa fa-quote-left',
            },
            {
                name: 'unordered-list',
                title: UListLabel,
                action: EasyMDE.toggleUnorderedList,
                className: 'fa fa-list-ul',
            },
            {
                name: 'ordered-list',
                title: OListLabel,
                action: EasyMDE.toggleOrderedList,
                className: 'fa fa-list-ol',
            },
            '|',
            {
                name: 'link',
                title: LinkLabel,
                action: EasyMDE.drawLink,
                className: 'fa fa-link',
            },
            {
                name: 'image',
                title: ImageLabel,
                action: EasyMDE.drawImage,
                className: 'fa fa-picture-o',
            },
            {
                name: 'table',
                title: TableLabel,
                action: EasyMDE.drawTable,
                className: 'fa fa-table',
            },
            '|',
            {
                name: 'guide',
                title: MDGuideLabel,
                action: markdownGuideUrl || 'https://www.markdownguide.org/basic-syntax',
                className: 'fa fa-question-circle',
            },
        ]

        return {
            toolbar,
            status: false,
            spellChecker: false,
            sideBySideFullscreen: false,
            // NOTE: maxHeight should not be set as it sets fixed size instead of max-height:
            // https://github.com/Ionaru/easy-markdown-editor/blob/2996b67ec95ec69000ee03ccaee4fcca26cfc701/README.md?plain=1#L147
            minHeight,
        }
    }, [
        BoldTextLabel,
        HeadingTextLabel,
        ImageLabel,
        ItalicTextLabel,
        LinkLabel,
        MDGuideLabel,
        OListLabel,
        QuoteTextLabel,
        RedoLabel,
        TableLabel,
        UListLabel,
        UndoLabel,
        minHeight,
    ])

    const style = useMemo(() => ({ '--md-editor-max-height': maxHeight } as CSSProperties), [maxHeight])

    const countClassName = classNames('condo-input-count', {
        [styles.editorInputCountOverflow]: internalValue.length > maxLength,
    })

    return (
        <div className={styles.editorContainer} data-max-height={maxHeight}>
            <SimpleMDE
                placeholder={placeholder}
                value={internalValue}
                onChange={internalOnChange}
                options={options}
                style={style}
                getMdeInstance={getMdeInstance}
            />
            <div className={styles.bottomPanel}>
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