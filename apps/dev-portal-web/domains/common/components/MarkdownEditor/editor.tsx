import getConfig from 'next/config'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import SimpleMDE from 'react-simplemde-editor'

import type { SimpleMDEReactProps } from 'react-simplemde-editor'

const { publicRuntimeConfig: { markdownGuideUrl } } = getConfig()

// TODO: labels, counter, initialProps, styles, bottomAction (AI)

export const MarkdownEditor: React.FC = () => {
    const intl = useIntl()


    const options: SimpleMDEReactProps['options'] = useMemo(() => {
        const toolbar: Required<SimpleMDEReactProps>['options']['toolbar'] = [
            'bold',
            'italic',
            'heading-2',
            '|',
            'quote',
            'unordered-list',
            'ordered-list',
            '|',
            'link',
            'image',
            'table',
            '|',
            (markdownGuideUrl ? {
                name: 'guide',
                title: 'Guide',
                action: markdownGuideUrl,
                className: 'fa fa-question-circle',
            } : 'guide'),
        ]

        return {
            toolbar,
            status: false,
            spellChecker: false,
            minHeight: '200px',
            maxHeight: '400px',
        }
    }, [])

    return (
        <SimpleMDE options={options} />
    )
}