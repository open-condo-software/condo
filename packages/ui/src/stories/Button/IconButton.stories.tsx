import { StoryFn, Meta } from '@storybook/react'
import React from 'react'

import * as condoIcons from '@open-condo/icons'
import { Button as Component } from '@open-condo/ui/src'

const { Trash } = condoIcons

const icons = Object.assign({}, ...Object.entries(condoIcons).map(([key, Icon]) => ({
    [`${key}-small`]: <Icon size='small'/>,
    [`${key}-medium`]: <Icon size='medium'/>,
    [`${key}-large`]: <Icon size='large'/>,
})))

export default {
    title: 'Components/Button',
    component: Component.Icon,
    args: {
        children: <Trash size='medium' />,
        disabled: false,
        size: 'medium',
    },
    argTypes: {
        size: { control: 'select', options: ['small', 'medium'] },
        children: {
            options: Object.keys(icons),
            mapping: icons,
            control: {
                type: 'select',
            },
        },
        disabled: { control: 'boolean', default: false },
        onClick: { control: false },
        href: { control: false },
        target: { control: false },
        htmlType: { defaultValue: 'button' },
    },
} as Meta<typeof Component.Icon>

const Template: StoryFn<typeof Component.Icon> = (props) => <Component.Icon {...props}/>

export const IconButton = Template.bind({})
