import omit from 'lodash/omit'
import React from 'react'
import ReactMarkdown, { ReactMarkdownOptions } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { CodeWrapper } from './codeWrapper'

import { Checkbox } from '../Checkbox'
import { Typography } from '../Typography'

const REMARK_PLUGINS: Array<any> = [
    remarkGfm,
]

export type MarkdownProps = {
    children: string
    onCheckboxChange?: (newMarkdownContent: string) => void
    components?: Pick<ReactMarkdownOptions, 'components'>
}

const MARKDOWN_CLASS_PREFIX = 'condo-markdown'

const TaskListItem: React.FC<{
    node: any
    checked?: boolean
    children: React.ReactNode
    onToggle?: (checked: boolean) => void
    disabled?: boolean
}> = ({
    checked = false,
    children,
    onToggle,
    disabled = false,
    node,
}) => {
    const position = node.position

    console.log('checkbox position', position)

    return (
        <li style={{ listStyle: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Checkbox
                    checked={checked}
                    // @ts-ignore
                    onChange={(e) => onToggle?.({ checked: e.target.checked, e: e, position })}
                    disabled={disabled}
                />
                <Typography.Text type='secondary'>
                    {children}
                </Typography.Text>
            </div>
        </li>
    )
}

export const Markdown: React.FC<MarkdownProps> = ({ children, components, onCheckboxChange }) => {
    const hasInteractiveCheckboxes = onCheckboxChange && typeof onCheckboxChange === 'function'
    console.log('hasInteractiveCheckboxes', onCheckboxChange, hasInteractiveCheckboxes)

    // @ts-ignore
    const callOnCheckboxChange = ({ checked, e, position }) => {
        console.log('position', position)
        console.log('checked', checked)
        console.log('e', e)

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
                h1: (props) => <Typography.Title {...omit(props, 'ref')} level={1}/>,
                h2: (props) => <Typography.Title {...omit(props, 'ref')} level={2}/>,
                h3: (props) => <Typography.Title {...omit(props, 'ref')} level={3}/>,
                h4: (props) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
                h5: (props) => <Typography.Title {...omit(props, 'ref')} level={5}/>,
                h6: (props) => <Typography.Title {...omit(props, 'ref')} level={6}/>,
                // TODO: Try more elegant solutions if deploys succeed
                p: (props: any) => <Typography.Paragraph {...omit(props, 'ref')} type='secondary' />,
                a: (props: any) => <Typography.Link {...omit(props, 'ref')} rel='noopener noreferer' target='_blank'/>,
                //li: ({ children, ...restProps }) => <li {...restProps}><Typography.Text type='secondary'>{children}</Typography.Text></li>,
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

                    // Check if this is a task list item by looking for checkbox input
                    const childrenArray = React.Children.toArray(children)
                    const checkboxChild = childrenArray.find(child =>
                        React.isValidElement(child) && child.props?.type === 'checkbox'
                    )

                    if (checkboxChild as React.ReactElement) {
                        console.log('rendering props:', props)

                        // @ts-ignore
                        const checked = checkboxChild?.props?.checked || false
                        // Remove the checkbox from children since we'll render it separately
                        const contentChildren = childrenArray.filter(child =>
                            !(React.isValidElement(child) && child.props?.type === 'checkbox')
                        )


                        return (
                            // @ts-ignore
                            <TaskListItem node={props.node} checked={checked} disabled={!hasInteractiveCheckboxes} onToggle={callOnCheckboxChange}>
                                {contentChildren}
                            </TaskListItem>
                        )
                    }

                    // Regular list item
                    return (
                        <li {...restProps}>
                            <Typography.Text type='secondary'>{children}</Typography.Text>
                        </li>
                    )
                },
                ...components,
            }}
        >
            {children}
        </ReactMarkdown>
    )
}