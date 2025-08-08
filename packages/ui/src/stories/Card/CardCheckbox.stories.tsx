import React, { ComponentProps } from 'react'

import { PlusCircle } from '@open-condo/icons'
import { Card as Component, CardCheckboxProps } from '@open-condo/ui/src'

import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5'

const CardCheckbox = Component.CardCheckbox

type StoryProps = ComponentProps<typeof CardCheckbox> & {
    disabled: boolean
    header: boolean
    headerProgressIndicator: boolean
    headerEmoji: boolean
    headerTitle: boolean
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
    component: CardCheckbox,
    args: {
        disabled: false,
        header: true,
        headerProgressIndicator: true,
        headerEmoji: true,
        headerTitle: true,
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
        headerProgressIndicator,
        headerEmoji,
        headerTitle,
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

    const headerProps: CardCheckboxProps['header'] = {
        progressIndicator: headerProgressIndicator
            ? { steps: ['completed'] }
            : undefined,
        emoji: headerEmoji ? [{ symbol: '✍️' }, { symbol: '🏠' }] : undefined,
        headingTitle: headerTitle ? 'Resident App' : undefined,
        image: headerImage
            ? { src: 'https://i.imgur.com/ambPuQF.png', size: 'big' }
            : undefined,
    }

    const bodyProps: CardCheckboxProps['body'] = {
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
            <CardCheckbox
                {...props}
                header={header ? headerProps : undefined}
                body={body ? bodyProps : undefined}
            />
        </div>
    )
}

export const CardCheckboxComponent: StoryObj<StoryProps> = {
    render: Template,
}
