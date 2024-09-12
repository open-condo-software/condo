import { Meta } from '@storybook/react'

import { Input as Component } from '@open-condo/ui/src'

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

export const Input = {}
