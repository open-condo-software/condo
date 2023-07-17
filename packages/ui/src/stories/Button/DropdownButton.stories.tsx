import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import { Play } from '@open-condo/icons'
import { DropdownButton } from '@open-condo/ui/src'

const LOREM_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aliquid amet dolores eligendi' +
    ' est ex, facilis, iure magnam molestias neque, possimus praesentium quidem repellat saepe similique vero vitae' +
    ' voluptatem voluptates?'

export default {
    title: 'Components/Button',
    component: DropdownButton,
    args: {
        children: 'Hover me',
        type: 'primary',
        disabled: false,
        danger: false,
        stateless: false,
        block: false,
    },
    argTypes: {
        block: { type: 'boolean', default: false },
        type: {
            control: {
                type: 'select',
                options: ['primary', 'secondary'],
            },
        },
    },
} as ComponentMeta<typeof DropdownButton>

const Template: ComponentStory<typeof DropdownButton> = (props) => <DropdownButton {...props}/>

export const WithDropdown = Template.bind({})
WithDropdown.args = {
    items: [{
        label: 'Short label',
    }, {
        label: LOREM_TEXT,
    }, {
        label: 'Label with description',
        description: 'Short description',
    }, {
        label: 'Label with long description',
        description: LOREM_TEXT,
    }, {
        label: 'Label with icon',
        icon: <Play size='medium' />,
    }, {
        label: LOREM_TEXT,
        icon: <Play size='medium' />,
    }, {
        label: 'Disabled',
        disabled: true,
    }, {
        label: 'Disabled',
        description: 'Short description',
        disabled: true,
    }, {
        label: 'Disabled',
        icon: <Play size='medium' />,
        disabled: true,
    }],
}
