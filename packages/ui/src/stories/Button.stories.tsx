import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import * as condoIcons from '@open-condo/icons'
import { Button } from '@open-condo/ui/src'

const icons = Object.assign({}, ...Object.entries(condoIcons).map(([key, Icon]) => ({
    [`${key}-small`]: <Icon size='small'/>,
    [`${key}-medium`]: <Icon size='medium'/>,
    [`${key}-large`]: <Icon size='large'/>,
})))

export default {
    title: 'Components/Button',
    component: Button,
    args: {
        children: 'Label',
        type: 'primary',
        disabled: false,
        danger: false,
        stateless: false,
        block: false,
    },
    argTypes: {
        block: { type: 'boolean', default: false },
        type: { control: 'select' },
        icon: {
            options: Object.keys(icons),
            mapping: icons,
            control: {
                type: 'select',
            },
        },
        onClick: { control: false },
        href: { control: false },
        target: { control: false },
        htmlType: { defaultValue: 'button' },
    },
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = (props) => <Button {...props}/>

export const Primary = Template.bind({})
Primary.args = {
    type: 'primary',
}
export const Secondary = Template.bind({})
Secondary.args = {
    type: 'secondary',
}
