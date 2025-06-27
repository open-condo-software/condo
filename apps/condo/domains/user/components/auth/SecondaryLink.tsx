import React from 'react'

import { TypographyLinkProps, Typography } from '@open-condo/ui'

import styles from './SecondaryLink.module.css'


export const SecondaryLink: React.FC<TypographyLinkProps> = (props) => {
    return (
        <span className={styles.secondaryLink}>
            <Typography.Link {...props} />
        </span>
    )
}
