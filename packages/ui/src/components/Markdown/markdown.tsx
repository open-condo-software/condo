import omit from 'lodash/omit'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { CodeWrapper } from './codeWrapper'

import { Checkbox } from '../Checkbox'
import { Typography } from '../Typography'

const REMARK_PLUGINS: Array<any> = [
    remarkGfm,
]

export type MarkdownProps = {
    children: string
    type?: 'default' | 'inline'
    onCheckboxChange?: (newMarkdownContent: string) => void
}

type PositionType = {
    start: {
        offset: number
        line: number
        column: number
    }
    end: {
        offset: number
        line: number
        column: number
    }
}

const MARKDOWN_CLASS_PREFIX = 'condo-markdown'
const MARKDOWN_TASK_LIST_CLASS_PREFIX = 'condo-markdown-task-list-item'

type TaskListItemType = {
    // Node is Element from @types/hast. I decided to skip the import and just declare the type myself
    // https://github.com/remarkjs/react-markdown?tab=readme-ov-file#appendix-b-components
    node: { position: PositionType }
    checked?: boolean
    children: React.ReactNode
    onToggle?: (checked: { checked: boolean, position: PositionType }) => void
    disabled?: boolean
    type?: 'default' | 'inline'
}

const TaskListItem: React.FC<TaskListItemType> = ({
    checked = false,
    children,
    onToggle,
    disabled = false,
    node,
    type = 'default',
}) => {
    const position = node.position

    return (
        <li>
            <div className={MARKDOWN_TASK_LIST_CLASS_PREFIX}>
                <Checkbox
                    checked={checked}
                    onChange={(e) => onToggle?.({ checked: e.target.checked, position })}
                    disabled={disabled}
                />
                <Typography.Text type={type === 'inline' ? undefined : 'secondary'}>
                    {children}
                </Typography.Text>
            </div>
        </li>
    )
}

const MARKDOWN_COMPONENTS_BY_TYPE = {
    'default': {
        h1: (props: any) => <Typography.Title {...omit(props, 'ref')} level={1}/>,
        h2: (props: any) => <Typography.Title {...omit(props, 'ref')} level={2}/>,
        h3: (props: any) => <Typography.Title {...omit(props, 'ref')} level={3}/>,
        h4: (props: any) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
        h5: (props: any) => <Typography.Title {...omit(props, 'ref')} level={5}/>,
        h6: (props: any) => <Typography.Title {...omit(props, 'ref')} level={6}/>,
    },
    // Inline should be used when displaying text formatted by user
    'inline': {
        h1: (props: any) => <Typography.Paragraph strong {...omit(props, 'ref')} type='primary' />,
        h2: (props: any) => <Typography.Paragraph strong {...omit(props, 'ref')} type='primary' />,
        h3: (props: any) => <Typography.Paragraph strong {...omit(props, 'ref')} type='primary' />,
        h4: (props: any) => <Typography.Paragraph strong {...omit(props, 'ref')} type='primary' />,
        h5: (props: any) => <Typography.Paragraph strong {...omit(props, 'ref')} type='primary' />,
        h6: (props: any) => <Typography.Paragraph strong {...omit(props, 'ref')} type='primary' />,
        p: (props: any) => <Typography.Paragraph {...omit(props, 'ref')} type='primary' />,
    },
}

export const Markdown: React.FC<MarkdownProps> = ({ children, type = 'default', onCheckboxChange }) => {
    if (!MARKDOWN_COMPONENTS_BY_TYPE.hasOwnProperty(type)) {
        throw new Error('Unsupported markdown type')
    }

    const hasInteractiveCheckboxes = onCheckboxChange && typeof onCheckboxChange === 'function'

    const callOnCheckboxChange: TaskListItemType['onToggle']  = ({ checked, position }) => {
        if (hasInteractiveCheckboxes) {
            const checkboxChangedPositionOffset = position.start.offset + 3

            const partBeforeCheckbox = children.slice(0, checkboxChangedPositionOffset)
            const partAfterCheckbox = children.slice(checkboxChangedPositionOffset + 1)
            const checkboxContent = checked ? 'x' : ' '

            const newMarkdown = partBeforeCheckbox + checkboxContent + partAfterCheckbox

            onCheckboxChange(newMarkdown)
        }
    }

    return (
        <ReactMarkdown
            className={`${MARKDOWN_CLASS_PREFIX} ${type === 'inline' ? `${MARKDOWN_CLASS_PREFIX}--inline` : ''}`}
            remarkPlugins={REMARK_PLUGINS}
            components={{
                ...MARKDOWN_COMPONENTS_BY_TYPE[type],
                a: (props: any) => <Typography.Link {...omit(props, 'ref')} rel='noopener noreferrer' target='_blank'/>,
                pre: (props: any) => <CodeWrapper {...props}/>,
                input: ({ type, checked, disabled, ...restProps }) => {
                    if (type !== 'checkbox') {
                        return <input type={type} {...restProps} />
                    }

                    return (
                        <Checkbox
                            checked={checked || false}
                            disabled
                        />
                    )
                },
                li: (props) => {
                    const { children, ...restProps } = props

                    const childrenArray = React.Children.toArray(children)
                    const checkboxChild = childrenArray.find(child =>
                        React.isValidElement(child) && child.props?.type === 'checkbox'
                    )

                    if (checkboxChild) {
                        const checked = React.isValidElement(checkboxChild) && checkboxChild?.props?.checked || false

                        const contentChildren = childrenArray.filter(child =>
                            !(React.isValidElement(child) && child.props?.type === 'checkbox')
                        )

                        return (
                            <TaskListItem node={props.node as any} checked={checked} disabled={!hasInteractiveCheckboxes} onToggle={callOnCheckboxChange} type={type}>
                                {contentChildren}
                            </TaskListItem>
                        )
                    }

                    const textColor = type === 'inline' ? undefined : 'secondary'

                    return (
                        <li {...restProps}>
                            <Typography.Text type={textColor}>{children}</Typography.Text>
                        </li>
                    )
                },
            }}
        >
            {children}
        </ReactMarkdown>
    )
}