import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Typography } from 'antd'

interface MarkDownProps {
    text: string,
    fontSize?: number,
    shouldParseHtml?: boolean,
}

/**
 * @deprecated Will be removed as soon as Markdown component in @open-condo/ui will be ready. Also unified will be bumped to 10.x with that release
 */
export const MarkDown: React.FC<MarkDownProps> = ({ text, fontSize, shouldParseHtml }) => {
    const style = fontSize ? { fontSize } : {}
    const rehypePlugins = shouldParseHtml ? [rehypeRaw] : []

    return (
        <Typography.Text type='secondary' style={style}>
            <ReactMarkdown
                rehypePlugins={rehypePlugins}
                remarkPlugins={[remarkGfm]}
            >
                {text}
            </ReactMarkdown>
        </Typography.Text>
    )
}