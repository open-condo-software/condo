import { Meta } from '@storybook/react'

import { Radio as Component } from '@open-condo/ui/src'

export default {
    title: 'Components/Radio',
    component: Component,
    args: {
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
        labelProps: {
            if: { arg: 'label' },
        },
        defaultChecked: {
            control: 'boolean',
            if: { arg: 'indeterminate', truthy: false },
        },
    },
} as Meta<typeof Component>

export const Unchecked = {
    args: {
        defaultChecked: false,
    },
}

export const Checked = {
    args: {
        checked: true,
        autoFocus: true,
    },
}

export const Disabled = {
    args: {
        disabled: true,
    },
}

export const BoldText = {
    args: {
        labelProps: { strong: true },
    },
}
