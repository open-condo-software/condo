import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React, { AnchorHTMLAttributes } from 'react'

import { Typography } from '@open-condo/ui'

export const Link: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, ...restProps }) => {
    const { locale } = useRouter()
    if (href && href.startsWith('/')) {
        return <NextLink href={href} {...restProps} locale={locale} className='condo-typography condo-link'/>
    }

    return <Typography.Link href={href} {...restProps} target='_blank' rel='noreferrer'/>
}