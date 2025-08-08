import get from 'lodash/get'
import React, { useMemo } from 'react'

import {
    Button,
    Modal as Component,
    Typography,
    Tabs,
} from '@open-condo/ui/src'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

const LOREM_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aliquid amet dolores eligendi' +
  ' est ex, facilis, iure magnam molestias neque, possimus praesentium quidem repellat saepe similique vero vitae' +
  ' voluptatem voluptates?'

export default {
    title: 'Components/Modal',
    component: Component,
    args: {
        title: 'Title',
        open: true,
        children: LOREM_TEXT,
        maskClosable: true,
        scrollX: true,
        width: 'small',
        customFooter: 'custom',
    },
    argTypes: {
        width: {
            options: ['small', 'big', 'fit-content'],
            control: { type: 'select' },
        },
        customFooter: {
            name: 'Try change "footer"',
            options: ['custom', 'null'],
            control: { type: 'select' },
        },
        footer: { control: false },
        onOk: { control: false },
        onCancel: { control: false },
        afterClose: { control: false },
        destroyOnClose: { control: false },
        getContainer: { control: false },
        zIndex: { control: false },
        className: { control: false },
    },
    parameters: {
        docs: { disable: true },
        previewTabs: { 'storybook/docs/panel': { hidden: true } },
        viewMode: 'story',
    },
} as Meta<typeof Component>

const Template: StoryFn<typeof Component> = (props) => {
    const { children, open, ...rest } = props
    const customFooter = get(props, 'customFooter')
    const footer = useMemo(() => {
        let footer = null
        if (customFooter === 'custom') {
            footer = [
                <Button type='secondary' children='Cancel' key='cancel' />,
                <Button type='primary' children='OK' key='ok' />,
            ]
        }
        return footer
    }, [customFooter])

    return (
        <div>
            <Typography.Paragraph>
        Some content in the background
            </Typography.Paragraph>
            {/* NOTE: won't close without this hack */}
            {open && (
                <Component
                    {...rest}
                    footer={footer}
                    open={open}
                    children={<Typography.Text>{children}</Typography.Text>}
                />
            )}
        </div>
    )
}

export const Modal: StoryObj<typeof Component> = {
    render: Template,
}

export const ModalWithBigContent: StoryObj<typeof Component> = {
    render: Template,
    args: {
        title:
      'Modal with big content. Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
        children: new Array(15)
            .fill(1)
            .map((_, ind) => (
                <Typography.Paragraph key={ind}>{LOREM_TEXT}</Typography.Paragraph>
            )),
    },
    argTypes: {
        children: { control: false },
    },
}

export const ModalWithWideContent: StoryObj<typeof Component> = {
    render: Template,
    args: {
        title: 'Modal with wide content',
        children: (
            <div style={{ width: '3000px', backgroundColor: 'lightgreen' }}>
        This is an imitation of very wide content.
            </div>
        ),
    },
    argTypes: {
        children: { control: false },
    },
}

export const ModalWithFixedContentWidth: StoryObj<typeof Component> = {
    render: Template,
    args: {
        title: 'Modal with fixed content width',
        children: (
            <div>
                <Tabs
                    items={Array.from({ length: 12 }, (_, key) => ({
                        key: `${key}`,
                        label: `Tab №${key}`,
                        children: (
                            <Typography.Paragraph>{`Tab number ${key} is selected now`}</Typography.Paragraph>
                        ),
                    }))}
                />
            </div>
        ),
        scrollX: false,
    },
}

export const Alert: StoryObj<typeof Component> = {
    render: Template,
    args: {
        title: 'Alert',
        children: (
            <Typography.Paragraph type='secondary'>
        Alert text with &quot;secondary&quot; type
            </Typography.Paragraph>
        ),
    },
    argTypes: {
        children: { control: false },
    },
}
