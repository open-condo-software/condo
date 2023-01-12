import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import omit from 'lodash/omit'
import { Typography } from '../Typography'
import { Checkbox } from '../Checkbox'

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
                code: (props) => <Typography.Text {...omit(props, 'ref')} code/>,
                li: ({ children, checked, ...restProps }) => {
                    if (restProps.className === 'task-list-item')
                        return <li><Checkbox label={children[2] as string} checked={checked as boolean} labelProps={{ type: 'secondary', size: 'large' }} disabled></Checkbox></li>
                    return <li {...restProps}><Typography.Text type='secondary'>{children}</Typography.Text></li>
                },
            }}
        >
            {children}
        </ReactMarkdown>
    )
}