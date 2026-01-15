import EasyMDE from 'easymde'
import getConfig from 'next/config'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import SimpleMDE from 'react-simplemde-editor'

import type { SimpleMDEReactProps } from 'react-simplemde-editor'

const { publicRuntimeConfig: { markdownGuideUrl } } = getConfig()

// TODO: counter, initialProps, styles, bottomAction (AI)

export const MarkdownEditor: React.FC = () => {
    const intl = useIntl()
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


    const options: SimpleMDEReactProps['options'] = useMemo(() => {
        const toolbar: Required<SimpleMDEReactProps>['options']['toolbar'] = [
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
            minHeight: '200px',
            maxHeight: '400px',
        }
    }, [BoldTextLabel, HeadingTextLabel, ImageLabel, ItalicTextLabel, LinkLabel, MDGuideLabel, OListLabel, QuoteTextLabel, TableLabel, UListLabel])

    return (
        <SimpleMDE options={options} />
    )
}