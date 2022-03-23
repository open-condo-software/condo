import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Typography } from 'antd'

interface MarkDownProps {
    text: string,
}

export const MarkDown: React.FC<MarkDownProps> = ({ text }) => {

    return (
        <Typography.Text type={'secondary'}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
            >
                {text}
            </ReactMarkdown>
        </Typography.Text>
    )
}