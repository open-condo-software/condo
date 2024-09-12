import { Meta } from '@storybook/react'
import React from 'react'

import * as condoIcons from '@open-condo/icons'
import { Tag as Component } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'


const icons = Object.assign({}, ...Object.entries(condoIcons).map(([key, Icon]) => ({
    [`${key}-small`]: <Icon size='small'/>,
})))

export default {
    title: 'Components/Tag',
    component: Component,
    args: {
        children: 'Label',
        textColor: colors.gray['7'],
        bgColor: colors.gray['1'],
    },
    argTypes: {
        icon: {
            options: Object.keys(icons),
            mapping: icons,
            control: {
                type: 'select',
            },
        },
        iconPosition: {
            control: { type: 'select' },
            options: ['start', 'end'],
        },
    },
} as Meta<typeof Component>

export const Tag = {}

export const TagWithIcon = {
    args: {
        icon: icons['ChevronDown-small'],
        iconPosition: 'end',
    },
}
