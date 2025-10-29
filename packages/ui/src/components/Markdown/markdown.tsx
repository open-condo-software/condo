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
    type: 'default' | 'lite'
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

type TaskListItemType = {
    node: { 
        position: PositionType
    }
    checked?: boolean
    children: React.ReactNode
    onToggle?: (checked: { checked: boolean, position: PositionType }) => void
    disabled?: boolean
}

const TaskListItem: React.FC<TaskListItemType> = ({
    checked = false,
    children,
    onToggle,
    disabled = false,
    node,
}) => {
    const position = node.position

    return (
        <li style={{ listStyle: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Checkbox
                    checked={checked}
                    onChange={(e) => onToggle?.({ checked: e.target.checked, position })}
                    disabled={disabled}
                />
                <Typography.Text type='secondary'>
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
    // Lite should be used when displaying text formatted by user
    'lite': {
        h1: (props: any) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
        h2: (props: any) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
        h3: (props: any) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
        h4: (props: any) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
        h5: (props: any) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
        h6: (props: any) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
        p: (props: any) => <Typography.Paragraph {...omit(props, 'ref')} type='primary' />,
    },
}

export const Markdown: React.FC<MarkdownProps> = ({ children, type = 'default', onCheckboxChange }) => {
    if (!MARKDOWN_COMPONENTS_BY_TYPE.hasOwnProperty(type)) {
        throw new Error('Unsupported markdown type')
    }

    const hasInteractiveCheckboxes = onCheckboxChange && typeof onCheckboxChange === 'function'

    const callOnCheckboxChange: TaskListItemType['onToggle']  = ({ checked, position }) => {
        console.log('position', position)
        console.log('checked', checked)

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
            className={MARKDOWN_CLASS_PREFIX}
            remarkPlugins={REMARK_PLUGINS}
            components={{
                ...MARKDOWN_COMPONENTS_BY_TYPE[type],
                a: (props: any) => <Typography.Link {...omit(props, 'ref')} rel='noopener noreferer' target='_blank'/>,
                pre: (props: any) => <CodeWrapper {...props}/>,
                input: (props) => {
                    if (props.type !== 'checkbox') {
                        return <input {...props} />
                    }

                    return (
                        <Checkbox
                            checked={props.checked || false}
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
                            <TaskListItem node={props.node as any} checked={checked} disabled={!hasInteractiveCheckboxes} onToggle={callOnCheckboxChange}>
                                {contentChildren}
                            </TaskListItem>
                        )
                    }

                    return (
                        <li {...restProps}>
                            <Typography.Text type='secondary'>{children}</Typography.Text>
                        </li>
                    )
                },
            }}
        >
            {children}
        </ReactMarkdown>
    )
}