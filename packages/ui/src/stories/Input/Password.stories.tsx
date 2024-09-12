import { Meta } from '@storybook/react'

import { Input } from '@open-condo/ui/src'

const Component = Input.Password

export default {
    title: 'Components/Input',
    component: Component,
    args: {
        placeholder: 'Placeholder',
        disabled: false,
    },
} as Meta<typeof Component>

export const Password = {}
