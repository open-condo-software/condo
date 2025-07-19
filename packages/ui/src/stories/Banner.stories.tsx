import { Banner as Component } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Banner',
    component: Component,
    argTypes: {
        backgroundColor: {
            control: 'text',
        },
        onClick: { control: false },
        size: {
            control: {
                type: 'select',
                options: [undefined, 'compact'],
            },
        },
    },
} as Meta<typeof Component>

export const Solid: StoryObj<typeof Component> = {
    args: {
        backgroundColor: '#9b9dfa',
        title: 'Settlement bank',
        subtitle: 'Accept payments from residents in the Doma mobile app',
        imgUrl: 'https://i.imgur.com/OAG817v.png',
        invertText: true,
        actionText: 'More',
    },
}

export const Gradient: StoryObj<typeof Component> = {
    args: {
        backgroundColor: colors.brandGradient['1'],
        title: 'Some long description that takes 2 rows of texts',
        subtitle:
      'Text can also takes up to 2 rows, containing 40 symbols each, so use it wisely',
        imgUrl: 'https://i.imgur.com/1iOC5BE.png',
        invertText: false,
        actionText: 'Click me button',
    },
}

export const NoAction: StoryObj<typeof Component> = {
    args: {
        backgroundColor: '#d3e3ff',
        title: 'Banner can exist without an action button',
        subtitle:
      'Text can also takes up to 2 rows, containing 40 symbols each, so use it wisely',
        imgUrl: 'https://i.imgur.com/ambPuQF.png',
        invertText: false,
    },
}

export const Compact: StoryObj<typeof Component> = {
    args: {
        backgroundColor: '#d3e3ff',
        title: 'Banner can exist without an action button',
        subtitle:
      'Text can also takes up to 2 rows, containing 40 symbols each, so use it wisely',
        imgUrl: 'https://i.imgur.com/ambPuQF.png',
        invertText: false,
        actionText: 'Click me link',
        size: 'small',
    },
}
