import { Meta, Story } from '@storybook/react'
import {  pickBy } from 'lodash'
import React from 'react'

import { PlusCircle } from '@open-condo/icons'
import { Card as Component, CardCheckboxProps } from '@open-condo/ui/src'


const CardCheckbox = Component.CardCheckbox

type StoryProps = Pick<CardCheckboxProps, 'disabled'> & {
    disabled: boolean
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
    title: 'Components/CardCheckbox',
    component: CardCheckbox,
    args: {
        disabled: false,
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

const Template: Story<StoryProps> = (props) => {
    const {
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

    const headerProps = pickBy({
        progressIndicator: headerProgressIndicator && { steps: ['done'] },
        emoji: headerEmoji && [{ symbol: 0x1F469 }, { symbol: 0x1F468 }],
        headingTitle: headerTitle && 'Resident App',
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
            <CardCheckbox
                {...props}
                header={headerProps}
                body={body ? bodyProps : undefined}
            />
        </div>
    )
}

export const CardCheckboxComponent = Template.bind({})