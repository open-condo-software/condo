import React, { MouseEventHandler } from 'react'

import { IconProps } from '@open-condo/icons'

import { CARD_CLASS_PREFIX } from './constants'

import { Typography } from '../../Typography'


export type CardLinkType = {
    LinkWrapper?: React.FC<{ children: React.ReactElement, href: string }>
    label: string
    href: string
    PreIcon?: React.FC<IconProps>
    AfterIcon?: React.FC<IconProps>
    openInNewTab?: boolean
}

export const renderLink = (linkProps: CardLinkType) => {
    const { PreIcon, AfterIcon, LinkWrapper, label, href, openInNewTab } = linkProps

    const handleLinkClick: MouseEventHandler = e => e.stopPropagation()
    const target = openInNewTab ? '_bank' : '_self'

    const linkContent = (
        <Typography.Link
            href={href}
            onClick={handleLinkClick}
            target={target}
        >
            <div className={`${CARD_CLASS_PREFIX}-link-content`}>
                {PreIcon && <PreIcon size='small' />}
                {label}
                {AfterIcon && <AfterIcon size='small' />}
            </div>
        </Typography.Link>
    )

    if (LinkWrapper) {
        return (
            <LinkWrapper href={href}>
                {linkContent}
            </LinkWrapper>
        )
    }

    return linkContent
}