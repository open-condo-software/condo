import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import * as condoIcons from '@open-condo/icons'
import { IconButton as Component } from '@open-condo/ui/src'

const { Trash } = condoIcons

const icons = Object.assign({}, ...Object.entries(condoIcons).map(([key, Icon]) => ({
    [`${key}-small`]: <Icon size='small'/>,
    [`${key}-medium`]: <Icon size='medium'/>,
    [`${key}-large`]: <Icon size='large'/>,
})))

export default {
    title: 'Components/IconButton',
    component: Component,
    args: {
        children: <Trash size='medium' />,
        disabled: false,
        focus: false,
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
        focus: { type: 'boolean', default: false },
        disabled: { control: 'boolean', default: false },
        onClick: { control: false },
        href: { control: false },
        target: { control: false },
        htmlType: { defaultValue: 'button' },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (props) => <Component {...props}/>

export const IconButton = Template.bind({})
