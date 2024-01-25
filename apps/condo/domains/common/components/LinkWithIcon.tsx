import Link from 'next/link'
import React from 'react'

import { IconProps } from '@open-condo/icons'
import { Typography, TypographyLinkProps } from '@open-condo/ui'


type LinkWithIconPropsType = {
    href: string
    title: string
    size: TypographyLinkProps['size']
    PrefixIcon?: React.ComponentType<IconProps>
    PostfixIcon?: React.ComponentType<IconProps>
}

const CONTENT_WRAPPER_STYLE = { display: 'flex', flexFlow: 'row', gap: '8px', alignItems: 'center', justifyContent: 'center' }

export const LinkWithIcon: React.FC<LinkWithIconPropsType> = ({ href, title, size, PrefixIcon, PostfixIcon }) => {
    return (
        <Link href={href}>
            <Typography.Link size={size}>
                <div style={CONTENT_WRAPPER_STYLE}>
                    {PrefixIcon && <PrefixIcon size='small' />}
                    {title}
                    {PostfixIcon && <PostfixIcon size='small' />}
                </div>
            </Typography.Link>
        </Link>
    )
}