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

export const MarkDown: React.FC<MarkDownProps> = ({ text, fontSize, shouldParseHtml }) => {
    const style = fontSize ? { fontSize } : {}
    const rehypePlugins = shouldParseHtml ? [rehypeRaw] : []

    return (
        <Typography.Text type={'secondary'} style={style}>
            <ReactMarkdown
                rehypePlugins={rehypePlugins}
                remarkPlugins={[remarkGfm]}
            >
                {text}
            </ReactMarkdown>
        </Typography.Text>
    )
}