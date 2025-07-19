import { Input } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

const Component = Input.Phone

export default {
    title: 'Components/Input',
    component: Component,
    args: {
        disabled: false,
    },
} as Meta<typeof Component>

export const Phone: StoryObj<typeof Component> = {}
