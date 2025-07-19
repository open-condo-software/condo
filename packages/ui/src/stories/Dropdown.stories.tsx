import React from 'react'

import { Play } from '@open-condo/icons'
import { Dropdown, Space, Typography } from '@open-condo/ui/src'

import type { Meta, StoryObj, StoryFn } from '@storybook/react-webpack5'

const LOREM_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aliquid amet dolores eligendi' +
  ' est ex, facilis, iure magnam molestias neque, possimus praesentium quidem repellat saepe similique vero vitae' +
  ' voluptatem voluptates?'

export default {
    title: 'Components/Dropdown',
    component: Dropdown,
} as Meta<typeof Dropdown>

const DifferentSizeOfTriggersTemplate: StoryFn<typeof Dropdown> = () => {
    return (
        <>
            <Space size={24} direction='vertical'>
                <Space size={4} direction='vertical'>
                    <Typography.Text>10px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 10, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
                <Space size={4} direction='vertical'>
                    <Typography.Text>50px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 50, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
                <Space size={4} direction='vertical'>
                    <Typography.Text>100px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 100, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
                <Space size={4} direction='vertical'>
                    <Typography.Text>150px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 150, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
                <Space size={4} direction='vertical'>
                    <Typography.Text>200px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 200, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
                <Space size={4} direction='vertical'>
                    <Typography.Text>300px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 300, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
                <Space size={4} direction='vertical'>
                    <Typography.Text>500px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 500, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
                <Space size={4} direction='vertical'>
                    <Typography.Text>700px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 700, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
                <Space size={4} direction='vertical'>
                    <Typography.Text>1000px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 1000, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
                <Space size={4} direction='vertical'>
                    <Typography.Text>Oversize - 2000px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 50, width: 2000, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
            </Space>
            <div style={{ marginTop: 24 }}>
                <Typography.Text>100%</Typography.Text>
                <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                    <div style={{ height: 50, width: '100%', backgroundColor: 'red' }} />
                </Dropdown>
            </div>
            <div style={{ marginTop: 24, marginBottom: 200 }}>
                <Space size={4} direction='vertical'>
                    <Typography.Text>300px x 300px</Typography.Text>
                    <Dropdown menu={{ items: [{ label: '1', key: '1' }] }}>
                        <div style={{ height: 300, width: 300, backgroundColor: 'red' }} />
                    </Dropdown>
                </Space>
            </div>
        </>
    )
}
const DropdownButtonTemplate: StoryFn<typeof Dropdown.Button> = () => {
    return (
        <>
            <Space size={24} direction='vertical'>
                <Dropdown.Button
                    items={[
                        {
                            label: 'Short label',
                            key: '1',
                        },
                        {
                            label: 'Label with description',
                            description: 'Short description',
                            key: '2',
                        },
                        {
                            label: 'Label with icon',
                            icon: <Play size='medium' />,
                            key: '3',
                        },
                        {
                            label: 'Disabled',
                            disabled: true,
                            key: '4',
                        },
                        {
                            label: 'Disabled',
                            description: 'Short description',
                            disabled: true,
                            key: '5',
                        },
                        {
                            label: 'Disabled',
                            icon: <Play size='medium' />,
                            disabled: true,
                            key: '6',
                        },
                    ]}
                    children='With small dropdown content'
                    type='primary'
                />
                <Dropdown.Button
                    items={[
                        {
                            label: LOREM_TEXT,
                            key: '7',
                        },
                        {
                            label: 'Label with long description',
                            description: LOREM_TEXT,
                            key: '8',
                        },
                        {
                            label: LOREM_TEXT,
                            icon: <Play size='medium' />,
                            key: '9',
                        },
                    ]}
                    children='With big dropdown content'
                    type='secondary'
                    id='btn1'
                />
            </Space>
            <div style={{ marginTop: 24 }}>
                <Dropdown.Button
                    items={[
                        {
                            label: 'Short label',
                            key: '10',
                        },
                        {
                            label: 'Label with description',
                            description: 'Short description',
                            key: '11',
                        },
                    ]}
                    children='Block button'
                    type='primary'
                    buttonProps={{ danger: true, block: true }}
                />
            </div>
            <div style={{ marginTop: 24 }}>
                <Dropdown.Button
                    items={[
                        {
                            label: LOREM_TEXT,
                            key: '12',
                        },
                        {
                            label: 'Label with long description',
                            description: LOREM_TEXT,
                            key: '13',
                        },
                        {
                            label: LOREM_TEXT,
                            icon: <Play size='medium' />,
                            key: '14',
                        },
                    ]}
                    children='Block button with big dropdown content'
                    type='secondary'
                    buttonProps={{ danger: true, block: true }}
                />
            </div>
        </>
    )
}

export const Controlled: StoryObj<typeof Dropdown> = {
    args: {
        menu: {
            items: [
                { label: 'first', key: '1' },
                { label: 'second', key: '2' },
            ],
        },
        children: (
            <div style={{ height: 50, width: 200, backgroundColor: 'red' }} />
        ),
        open: true,
    },
}

export const DifferentSizeOfTriggers: StoryObj<typeof Dropdown> = {
    render: DifferentSizeOfTriggersTemplate,
}

export const WithButton: StoryObj<typeof Dropdown.Button> = {
    render: DropdownButtonTemplate,
}
