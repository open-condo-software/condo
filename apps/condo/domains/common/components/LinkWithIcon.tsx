import Link from 'next/link'
import React, { useMemo } from 'react'

import { IconProps } from '@open-condo/icons'
import { Typography, TypographyLinkProps } from '@open-condo/ui'


type LinkWithIconPropsType = {
    href: string
    title: string
    size: TypographyLinkProps['size']
    target?: '_self' | '_blank'
    PrefixIcon?: React.ComponentType<IconProps>
    PostfixIcon?: React.ComponentType<IconProps>
}

const CONTENT_WRAPPER_STYLE = { display: 'flex', flexFlow: 'row', gap: '8px', alignItems: 'center' }

export const LinkWithIcon: React.FC<LinkWithIconPropsType> = ({ href, title, size, PrefixIcon, PostfixIcon, target = '_self' }) => {
    const linkContent = useMemo(() => (
        <div style={CONTENT_WRAPPER_STYLE}>
            {PrefixIcon && <PrefixIcon size='small' />}
            {title}
            {PostfixIcon && <PostfixIcon size='small' />}
        </div>
    ), [PostfixIcon, PrefixIcon, title])

    if (target === '_blank') {
        return (
            <Typography.Link href='/property' target='_blank' size={size}>
                {linkContent}
            </Typography.Link>
        )
    }

    return (
        <Link href={href}>
            <Typography.Link size={size}>
                {linkContent}
            </Typography.Link>
        </Link>
    )
}