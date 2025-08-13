import Link from 'next/link'
import React from 'react'

import { Typography, TypographyLinkProps } from '@open-condo/ui'


export const renderPhone = (value) => {
    if (value) {
        return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 8)} ${value.slice(8, 10)} ${value.slice(10, 12)}`
    }
}


type renderLinkType =
    (content: JSX.Element | string, href: string, underline?: boolean, target?: TypographyLinkProps['target'])
    => React.ReactElement

export const renderLink: renderLinkType = (content, href, underline = true, target) => {
    const LinkComponent = underline ? Typography.Link : Link

    return (
        <LinkComponent href={href} target={target}>
            {content}
        </LinkComponent>
    )
}
