import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Typography } from 'antd'

interface MarkDownProps {
    text: string,
    fontSize?: number,
}

export const MarkDown: React.FC<MarkDownProps> = ({ text, fontSize }) => {
    const style = fontSize ? { fontSize } : {}

    return (
        <Typography.Text type={'secondary'} style={style}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
            >
                {text}
            </ReactMarkdown>
        </Typography.Text>
    )
}