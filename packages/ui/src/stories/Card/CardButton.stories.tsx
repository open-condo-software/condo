import React, { ComponentProps } from 'react'

import { PlusCircle } from '@open-condo/icons'
import { Card as Component, CardButtonProps } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5'

const CardButton = Component.CardButton

type StoryProps = ComponentProps<typeof CardButton> & {
    accent: boolean
    disabled: boolean
    headerTag: boolean
    header: boolean
    headerProgressIndicator: boolean
    headerEmoji: boolean
    headerTitle: boolean
    headerMainLink: boolean
    headerSecondLink: boolean
    headerImage: boolean
    body: boolean
    bodyTitle: boolean
    bodyDescription: boolean
    bodyImage: boolean
    bodyCaption: boolean
    bodyMainLink: boolean
    bodySecondLink: boolean
    bodyButton: boolean
}

export default {
    title: 'Components/Card',
    component: CardButton,
    args: {
        accent: false,
        disabled: false,
        header: true,
        headerTag: true,
        headerProgressIndicator: true,
        headerEmoji: true,
        headerTitle: true,
        headerMainLink: true,
        headerSecondLink: true,
        headerImage: true,
        body: true,
        bodyTitle: true,
        bodyDescription: true,
        bodyImage: true,
        bodyCaption: true,
        bodyMainLink: true,
        bodySecondLink: true,
        bodyButton: true,
    },
} as Meta<StoryProps>

const Template: StoryFn<StoryProps> = (props) => {
    const {
        header,
        headerTag,
        headerProgressIndicator,
        headerEmoji,
        headerTitle,
        headerMainLink,
        headerSecondLink,
        headerImage,
        body,
        bodyTitle,
        bodyDescription,
        bodyImage,
        bodyCaption,
        bodyMainLink,
        bodySecondLink,
        bodyButton,
    } = props

    const headerProps: CardButtonProps['header'] = {
        tag: headerTag
            ? {
                children: 'Tag text',
                bgColor: colors.teal[1],
                textColor: colors.teal[5],
            }
            : undefined,
        progressIndicator: headerProgressIndicator
            ? { steps: ['completed'] }
            : undefined,
        emoji: headerEmoji ? [{ symbol: '✍️' }, { symbol: '🏠' }] : undefined,
        headingTitle: headerTitle ? 'Resident App' : undefined,
        mainLink: headerMainLink
            ? {
                label: 'Main link',
                href: '#',
                AfterIcon: PlusCircle,
                PreIcon: PlusCircle,
            }
            : undefined,
        secondLink: headerSecondLink
            ? {
                label: 'Second link',
                href: '#',
                AfterIcon: PlusCircle,
                PreIcon: PlusCircle,
            }
            : undefined,
        image: headerImage
            ? { src: 'https://i.imgur.com/ambPuQF.png', size: 'big' }
            : undefined,
    }

    const bodyProps: CardButtonProps['body'] = {
        bodyTitle: bodyTitle ? 'Resident App' : undefined,
        description: bodyDescription
            ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
            : undefined,
        image: bodyImage
            ? {
                src: 'https://i.imgur.com/ambPuQF.png',
                style: {
                    width: '120px',
                    height: '150px',
                    borderRadius: '10px',
                    marginTop: '10px',
                },
            }
            : undefined,
        caption: bodyCaption
            ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
            : undefined,
        mainLink: bodyMainLink
            ? {
                label: 'Main link',
                href: '#',
                AfterIcon: PlusCircle,
                PreIcon: PlusCircle,
            }
            : undefined,
        secondLink: bodySecondLink
            ? {
                label: 'Second link',
                href: '#',
                AfterIcon: PlusCircle,
                PreIcon: PlusCircle,
            }
            : undefined,
        button: bodyButton
            ? { children: 'Body button', type: 'secondary' }
            : undefined,
    }

    return (
        <div style={{ maxWidth: '400px' }}>
            <CardButton
                {...props}
                header={header ? headerProps : undefined}
                body={body ? bodyProps : undefined}
            />
        </div>
    )
}

export const CardButtonComponent: StoryObj<Meta<StoryProps>> = {
    render: Template,
    args: {
        accent: true,
    },
}
