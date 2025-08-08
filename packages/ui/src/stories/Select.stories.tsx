import React from 'react'

import { Select as Component, Space, SelectProps } from '@open-condo/ui/src'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

const AVAILABLE_TYPES: Array<SelectProps['type']> = [
    undefined,
    'success',
    'warning',
    'danger',
    'info',
    'secondary',
]

export default {
    title: 'Components/Select',
    component: Component,
    args: {
        options: [
            { label: 'First label', value: 1 },
            { label: 'Second label', value: 2 },
        ],
        placeholder: 'Choose an option',
        disabled: false,
    },
    argTypes: {
        placeholder: { type: 'string' },
        disabled: { type: 'boolean' },
        onChange: {
            table: {
                type: {
                    summary: 'MouseEventHandler<HTMLElement>',
                },
            },
            control: {
                type: null,
            },
        },
    },
} as Meta<typeof Component>

const MultipleTemplate: StoryFn<typeof Component> = (props) => (
    <Space direction='horizontal' size={20} wrap>
        {AVAILABLE_TYPES.map((type, index) => (
            <Component key={index} {...props} type={type} />
        ))}
    </Space>
)

export const Default: StoryObj<typeof Component> = {}

export const CustomContent: StoryObj<typeof Component> = {
    args: {
        options: [
            { label: 'Some custom content', value: 1, textType: 'danger' },
            { label: 'Another custom content', value: 2, textType: 'success' },
        ],
    },
}

export const CustomTypes: StoryObj<typeof Component> = {
    render: MultipleTemplate,
    args: {
        value: 1,
    },
}

export const GroupsContent: StoryObj<typeof Component> = {
    args: {
        options: [
            { label: 'Option without group', value: 0 },
            {
                label: 'Group 1',
                key: 'group1',
                options: [
                    { label: 'Group 1 option 1', value: 1, key: 1 },
                    { label: 'Group 1 option 2', value: 11, key: 11 },
                ],
            },
            {
                label: 'Group 2',
                key: 'group2',
                options: [
                    { label: 'Group 2 option 1', value: 2, key: 2 },
                    { label: 'Group 2 option 2', value: 22, key: 22 },
                ],
            },
        ],
    },
}

export const Multiple: StoryObj<typeof Component> = {
    args: {
        options: [
            { label: 'First label', value: 'First label' },
            { label: 'Second label', value: 'Second label' },
            { label: 'Third label', value: 'Third label' },
            { label: 'Fourth label', value: 'Fourth label' },
            {
                label:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
                value:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
            },
        ],
        mode: 'multiple',
    },
}

export const LongLabels: StoryObj<typeof Component> = {
    args: {
        options: [
            {
                label:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
                value: '1',
            },
            {
                label:
          'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
                value: '2',
            },
            {
                label:
          'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
                value: '3',
            },
        ],
        placeholder:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
    },
}

export const WithSearch: StoryObj<typeof Component> = {
    args: {
        options: [
            {
                label:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
                value: '1',
            },
            {
                label: 'Duis aute irure dolor in reprehenderit in ',
                value: '2',
            },
        ],
        showSearch: true,
        allowClear: true,
    },
}

export const EmptyData: StoryObj<typeof Component> = {
    args: {
        options: [],
        notFoundContentLabel: 'No data',
    },
}

export const WithHiddenOptions: StoryObj<typeof Component> = {
    args: {
        options: [
            { label: 'First label', value: '1' },
            { label: 'Second label', value: '2', hidden: true },
            { label: 'Third label', value: '3' },
        ],
        defaultValue: 'Second label',
    },
}
