import omit from 'lodash/omit'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { CodeWrapper } from './codeWrapper'

import { Typography } from '../Typography'

const REMARK_PLUGINS = [
    remarkGfm,
]

export type MarkdownProps = {
    children: string,
}

const MARKDOWN_CLASS_PREFIX = 'condo-markdown'

export const Markdown: React.FC<MarkdownProps> = ({ children }) => {
    return (
        <ReactMarkdown
            className={MARKDOWN_CLASS_PREFIX}
            remarkPlugins={REMARK_PLUGINS}
            components={{
                h1: (props) => <Typography.Title {...omit(props, 'ref')} level={1}/>,
                h2: (props) => <Typography.Title {...omit(props, 'ref')} level={2}/>,
                h3: (props) => <Typography.Title {...omit(props, 'ref')} level={3}/>,
                h4: (props) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
                h5: (props) => <Typography.Title {...omit(props, 'ref')} level={5}/>,
                h6: (props) => <Typography.Title {...omit(props, 'ref')} level={6}/>,
                p: (props) => <Typography.Paragraph {...omit(props, 'ref')} type='secondary' />,
                a: (props) => <Typography.Link {...omit(props, 'ref')} target='_blank'/>,
                li: ({ children, ...restProps }) => <li {...restProps}><Typography.Text type='secondary'>{children}</Typography.Text></li>,
                pre: (props) => <CodeWrapper {...props}/>,
            }}
        >
            {children}
        </ReactMarkdown>
    )
}