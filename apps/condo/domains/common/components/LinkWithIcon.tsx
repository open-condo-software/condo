import Link from 'next/link'
import React, { useMemo } from 'react'

import { IconProps } from '@open-condo/icons'
import { Typography, TypographyLinkProps } from '@open-condo/ui'


type LinkWithIconPropsType = {
    href?: string
    onClick?: () => void
    title: string
    size: TypographyLinkProps['size']
    target?: '_self' | '_blank'
    PrefixIcon?: React.ComponentType<IconProps>
    PostfixIcon?: React.ComponentType<IconProps>
}

const CONTENT_WRAPPER_STYLE = { display: 'inline-flex', textDecoration: 'underline', flexFlow: 'row', gap: '8px', alignItems: 'center' }

export const LinkWithIcon: React.FC<LinkWithIconPropsType> = ({ href, title, size, onClick, PrefixIcon, PostfixIcon, target = '_self' }) => {
    const linkContent = useMemo(() => (
        <div style={CONTENT_WRAPPER_STYLE}>
            {PrefixIcon && <PrefixIcon size='small' />}
            {title}
            {PostfixIcon && <PostfixIcon size='small' />}
        </div>
    ), [PostfixIcon, PrefixIcon, title])

    if (target === '_blank' || !href) {
        return (
            <Typography.Link
                href={href}
                onClick={onClick}
                target='_blank'
                size={size}
            >
                {linkContent}
            </Typography.Link>
        )
    }

    return (
        <Link href={href}>
            <Typography.Link href={href} size={size} onClick={onClick}>
                {linkContent}
            </Typography.Link>
        </Link>
    )
}