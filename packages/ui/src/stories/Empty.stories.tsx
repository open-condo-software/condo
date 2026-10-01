import React from 'react'

import { Empty as Component, Button } from '@open-condo/ui/src'
import type { EmptyProps } from '@open-condo/ui/src'

import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Empty',
    component: Component,
    args: {
        title: 'Oops, something went wrong',
        description: 'Try to refresh the page',
        border: false,
        action: false,
    },
} as Meta<typeof Component>

type StoryArgs = EmptyProps & { action?: boolean }

const Template: StoryFn<StoryArgs> = (args) => {
    const { action, ...restArgs } = args as StoryArgs

    return (
        <Component
            {...restArgs}
            action={action ? (
                <Button type='primary'>Refresh</Button>
            ) : undefined}
        />
    )
}


export const Empty: StoryObj<StoryArgs> = {
    render: Template,
}
