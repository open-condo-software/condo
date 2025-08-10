import { Col, Row } from 'antd'
import React from 'react'

import {
    ActionBar as Component,
    Button,
    Typography,
    Dropdown,
} from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

const LOREM_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aliquid amet dolores eligendi' +
  ' est ex, facilis, iure magnam molestias neque, possimus praesentium quidem repellat saepe similique vero vitae' +
  ' voluptatem voluptates?'

export default {
    title: 'Components/ActionBar',
    component: Component,
    argTypes: {
        message: { control: 'text' },
        actions: { control: false },
    },
} as Meta<typeof Component>

const Template: StoryFn<typeof Component> = (args) => {
    return (
        <Row style={{ height: '120vh' }}>
            <Col
                span={24}
                style={{
                    height: '120vh',
                    backgroundColor: colors.gray[3],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}
            >
                <Typography.Title>Content</Typography.Title>
            </Col>
            <Col span={24}>
                <Component {...args} />
            </Col>
        </Row>
    )
}

export const Simple: StoryObj<typeof Component> = {
    render: Template,
    args: {
        actions: [
            <Button type='primary' key='1'>
        Save
            </Button>,
            <Button type='secondary' key='2'>
        Cancel
            </Button>,
        ],
    },
}

export const WithMessage: StoryObj<typeof Component> = {
    render: Template,
    args: {
        message: 'Action bar message',
        actions: [
            <Button type='primary' key='1'>
        Save
            </Button>,
            <Button type='secondary' key='2'>
        Cancel
            </Button>,
        ],
    },
}

export const WithDropdownButton: StoryObj<typeof Component> = {
    render: Template,
    args: {
        actions: [
            <Dropdown.Button
                items={[{ label: 'Short label', key: 1 }]}
                key='1'
                type='primary'
                dropdownProps={{
                    getPopupContainer: (target) => target.parentElement || target,
                }}
            >
        Hover me 1
            </Dropdown.Button>,
            <Dropdown.Button
                items={[{ label: LOREM_TEXT, key: 2 }]}
                key='2'
                type='secondary'
                dropdownProps={{
                    getPopupContainer: (target) => target.parentElement || target,
                }}
            >
        Hover me 2
            </Dropdown.Button>,
        ],
    },
}
