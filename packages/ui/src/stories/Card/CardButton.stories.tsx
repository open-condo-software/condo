import { Meta, Story } from '@storybook/react'
import {  pickBy } from 'lodash'
import React from 'react'

import { PlusCircle } from '@open-condo/icons'
import { Card as Component, CardButtonProps } from '@open-condo/ui/src'

import { colors } from '../../colors'


const CardButton = Component.CardButton

type StoryProps = Pick<CardButtonProps, 'accent' | 'disabled'> & {
    accent: boolean
    disabled: boolean
    headerTag: boolean
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
    title: 'Components/CardButton',
    component: CardButton,
    args: {
        accent: false,
        disabled: false,
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

const Template: Story<StoryProps> = (props) => {
    const {
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

    const headerProps = pickBy({
        tag: headerTag && { children: 'Tag text', bgColor: colors.teal[1], textColor: colors.teal[5] },
        progressIndicator: headerProgressIndicator && { steps: ['done'] },
        emoji: headerEmoji && [{ symbol: 0x1F469 }, { symbol: 0x1F468 }],
        headingTitle: headerTitle && 'Resident App',
        mainLink: headerMainLink && { href: '', label: 'Main link', AfterIcon: PlusCircle, PreIcon: PlusCircle },
        secondLink: headerSecondLink && { href: '', label: 'Second link', AfterIcon: PlusCircle, PreIcon: PlusCircle },
        image: headerImage && { src: 'https://i.imgur.com/ambPuQF.png', size: 'big' },
    })

    const bodyProps = pickBy({
        bodyTitle: bodyTitle && 'Resident App',
        description: bodyDescription && 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        image: bodyImage && { src: 'https://i.imgur.com/ambPuQF.png', style: { width: '120px', height: '150px', borderRadius: '10px', marginTop: '10px' } },
        caption: bodyCaption && 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        mainLink: bodyMainLink && { href: '', label: 'Main link', AfterIcon: PlusCircle, PreIcon: PlusCircle },
        secondLink: bodySecondLink && { href: '', label: 'Second Link', AfterIcon: PlusCircle, PreIcon: PlusCircle },
        button: bodyButton && { children: 'Body button', type: 'secondary' },
    })

    return (
        <div style={{ maxWidth: '400px' }}>
            <CardButton
                {...props}
                header={headerProps}
                body={body ? bodyProps : undefined}
            />
        </div>
    )
}

export const CardButtonComponent = Template.bind({})
CardButtonComponent.args = {
    accent: true,
}