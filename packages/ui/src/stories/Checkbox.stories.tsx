import { Checkbox as Component } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Checkbox',
    component: Component,
    args: {
        indeterminate: false,
        checked: false,
        defaultChecked: false,
        disabled: false,
        autoFocus: false,
        label: 'Label',
    },
    argTypes: {
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
        checked: {
            control: 'boolean',
            if: { arg: 'indeterminate', truthy: false },
        },
        indeterminate: {
            control: 'boolean',
            if: { arg: 'checked', truthy: false },
        },
        labelProps: {
            if: { arg: 'label' },
        },
        defaultChecked: {
            control: 'boolean',
            if: { arg: 'indeterminate', truthy: false },
        },
    },
} as Meta<typeof Component>

export const Unchecked: StoryObj<typeof Component> = {
    args: {
        defaultChecked: false,
    },
}

export const Checked: StoryObj<typeof Component> = {
    args: {
        checked: true,
    },
}

export const Disabled: StoryObj<typeof Component> = {
    args: {
        checked: true,
        disabled: true,
    },
}

export const BoldText: StoryObj<typeof Component> = {
    args: {
        labelProps: { strong: true },
    },
}
