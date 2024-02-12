import React from 'react'

import { IconProps } from '@open-condo/icons'

import { Space } from '../../Space'
import { Typography } from '../../Typography'


export type CardLinkType = {
    href: string
    label: string
    PreIcon?: React.FC<IconProps>
    AfterIcon?: React.FC<IconProps>
}

export const renderLink = (linkProps: CardLinkType) => {
    const { PreIcon, AfterIcon, href, label } = linkProps

    return (
        <Space size={8} direction='horizontal' align='center'>
            {PreIcon && <PreIcon size='small' />}
            <Typography.Link href={href}>{label}</Typography.Link>
            {AfterIcon && <AfterIcon size='small' />}
        </Space>
    )
}