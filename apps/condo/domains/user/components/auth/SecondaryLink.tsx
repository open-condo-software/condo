import React from 'react'

import { TypographyLinkProps, Typography } from '@open-condo/ui'

import './SecondaryLink.css'


export const SecondaryLink: React.FC<TypographyLinkProps> = (props) => {
    return (
        <span className='secondary-link'>
            <Typography.Link {...props} />
        </span>
    )
}
