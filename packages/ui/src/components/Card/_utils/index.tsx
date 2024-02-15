import React, { MouseEventHandler } from 'react'

import { IconProps } from '@open-condo/icons'

import { Space } from '../../Space'
import { Typography } from '../../Typography'


export type CardLinkType = {
    LinkWrapper?: React.FC<{ children: React.ReactElement, href: string }>
    label: string
    href: string
    PreIcon?: React.FC<IconProps>
    AfterIcon?: React.FC<IconProps>
}

export const renderLink = (linkProps: CardLinkType) => {
    const { PreIcon, AfterIcon, LinkWrapper, label, href } = linkProps

    const handleLinkClick: MouseEventHandler = e => e.stopPropagation()

    return (
        <Space size={8} direction='horizontal' align='center'>
            {PreIcon && <PreIcon size='small' />}
            {
                LinkWrapper ? (
                    <LinkWrapper href={href}>
                        <Typography.Link href={href} onClick={handleLinkClick}>{label}</Typography.Link>
                    </LinkWrapper>
                ) : (
                    <Typography.Link href={href} onClick={handleLinkClick}>{label}</Typography.Link>
                )
            }
            {AfterIcon && <AfterIcon size='small' />}
        </Space>
    )
}