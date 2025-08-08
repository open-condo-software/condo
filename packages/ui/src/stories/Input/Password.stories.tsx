import { Input } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

const Component = Input.Password

export default {
    title: 'Components/Input',
    component: Component,
    args: {
        placeholder: 'Placeholder',
        disabled: false,
    },
} as Meta<typeof Component>

export const Password: StoryObj<typeof Component> = {}
