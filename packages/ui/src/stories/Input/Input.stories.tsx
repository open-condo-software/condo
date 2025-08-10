import { Input as Component } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Input',
    component: Component,
    args: {
        placeholder: 'Placeholder',
        disabled: false,
        allowClear: false,
        suffix: '',
        prefix: '',
    },
} as Meta<typeof Component>

export const Input: StoryObj<typeof Component> = {}
