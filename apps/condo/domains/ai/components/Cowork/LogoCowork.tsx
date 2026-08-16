import { Typography } from '@open-condo/ui'
import React from 'react'

import styles from './Cowork.module.css'


interface ILogoCoworkProps {
    onClick?: (e: React.SyntheticEvent) => void
    minified?: boolean
    title?: string
}

export const LogoCowork: React.FC<ILogoCoworkProps> = (props) => {
    const {
        onClick,
        minified,
        title,
    } = props

    if (minified) {
        return (
            <span onClick={onClick} className={`logo ${styles.logoCowork}`}>
                <svg width='30' height='32' viewBox='0 0 30 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path fillRule='evenodd' clipRule='evenodd' d='M13.2524 7.43139C12.5393 6.85101 11.515 6.8539 10.8051 7.43832L1.35804 15.2159C0.913337 15.582 0.655762 16.1274 0.655762 16.7029V29.6878C0.655762 30.7522 1.51993 31.6151 2.58593 31.6151H21.5981C22.6641 31.6151 23.5283 30.7522 23.5283 29.6878V16.7096C23.5283 16.1302 23.2673 15.5816 22.8175 15.2156L13.2524 7.43139ZM19.6679 27.7605V17.6251L12.0401 11.4174L4.5161 17.6117V27.7605H19.6679Z' fill='url(#paint0_linear_4390_38469)'/>
                    <defs>
                        <linearGradient id='paint0_linear_4390_38469' x1='0.655762' y1='19.3066' x2='19.0624' y2='28.3731' gradientUnits='userSpaceOnUse'>
                            <stop stopColor='#4CD174'/>
                            <stop offset='1' stopColor='#6DB8F2'/>
                        </linearGradient>
                    </defs>
                </svg>
                <span className={styles.logoCoworkRobot}>🤖</span>
            </span>
        )
    }

    return (
        <span onClick={onClick} className={`logo ${styles.logoCowork} ${styles.logoCoworkTitle}`}>
            <Typography.Title level={2} type='primary'>
                {title}
            </Typography.Title>
        </span>
    )
}
