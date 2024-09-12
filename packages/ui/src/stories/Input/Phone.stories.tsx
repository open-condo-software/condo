import { Meta } from '@storybook/react'

import { Input } from '@open-condo/ui/src'

const Component = Input.Phone

export default {
    title: 'Components/Input',
    component: Component,
    args: {
        disabled: false,
    },
} as Meta<typeof Component>

export const Phone = {}
