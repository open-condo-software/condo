import React from 'react'

import { Copy } from '@open-condo/icons'
import { Input as Component } from '@open-condo/ui/src'
import { Button } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react'

export default {
    title: 'Components/Textarea',
    component: Component.TextArea,
    args: {
        placeholder: 'Placeholder',
        bottomPanelUtils: [<Copy key={1} size='small' color='grey' />],
        submitButton: <Button.Icon><Copy key={1} size='small' /></Button.Icon>,
        autoSize: { minRows: 1, maxRows: 4 },
        disabled: false,
        rows: 1,
        showCount: true,
    },
} as Meta<typeof Component.TextArea>

export const TextArea: StoryObj<typeof Component.TextArea> = {}
