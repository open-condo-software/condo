import EasyMDE from 'easymde'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import SimpleMDE from 'react-simplemde-editor'

import styles from './editor.module.css'

import type { SimpleMDEReactProps } from 'react-simplemde-editor'

const { publicRuntimeConfig: { markdownGuideUrl } } = getConfig()

type MarkdownEditorProps = {
    value?: string
    onChange?: (value: string) => void
    maxLength?: number
    placeholder?: string
    minHeight?: string
    maxHeight?: string
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    placeholder,
    onChange,
    maxLength = 1000,
    minHeight = '200px',
    maxHeight = '400px',
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

    const internalOnChange = useCallback((value: string) => {
        const croppedValue = value.length > maxLength ? value.slice(0, maxLength) : value
        setInternalValue(croppedValue)
        onChange?.(croppedValue)
    }, [maxLength, onChange])

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value || '')
        }
    }, [value])


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
            minHeight,
            maxHeight,
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
        maxHeight,
        minHeight,
    ])

    return (
        <div className={styles.editorContainer}>
            <SimpleMDE
                placeholder={placeholder}
                value={internalValue}
                onChange={internalOnChange}
                options={options}
            />
            <div className={styles.bottomPanel}>
                <span className='condo-input-bottom-panel'>
                    <span className='condo-input-bottom-panel-right'>
                        <span className='condo-input-count'>
                            {internalValue.length}/{maxLength}
                        </span>
                    </span>
                </span>
            </div>
        </div>
    )
}