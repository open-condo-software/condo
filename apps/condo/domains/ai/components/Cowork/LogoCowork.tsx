import React from 'react'

import { Typography } from '@open-condo/ui'

import styles from './Cowork.module.css'


interface ILogoCoworkProps {
    minified?: boolean
    title?: string
}

const DOMA_PATH = 'M13.2524 7.43139C12.5393 6.85101 11.515 6.8539 10.8051 7.43832L1.35804 15.2159C0.913337 15.582 0.655762 16.1274 0.655762 16.7029V29.6878C0.655762 30.7522 1.51993 31.6151 2.58593 31.6151H21.5981C22.6641 31.6151 23.5283 30.7522 23.5283 29.6878V16.7096C23.5283 16.1302 23.2673 15.5816 22.8175 15.2156L13.2524 7.43139ZM19.6679 27.7605V17.6251L12.0401 11.4174L4.5161 17.6117V27.7605H19.6679Z'

const DomaMark: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox='0 0 30 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path fillRule='evenodd' clipRule='evenodd' d={DOMA_PATH} fill='url(#cowork-doma-grad)'/>
        <circle cx='25.6618' cy='4.23655' r='4.07053' fill='#FDCF5A'/>
        <defs>
            <linearGradient id='cowork-doma-grad' x1='0.655762' y1='19.3066' x2='19.0624' y2='28.3731' gradientUnits='userSpaceOnUse'>
                <stop stopColor='#4CD174'/>
                <stop offset='1' stopColor='#6DB8F2'/>
            </linearGradient>
        </defs>
    </svg>
)

export const LogoCowork: React.FC<ILogoCoworkProps> = (props) => {
    const {
        minified,
        title,
    } = props

    if (minified) {
        return (
            <span className={`logo ${styles.logoCowork}`}>
                <DomaMark size={30} />
            </span>
        )
    }

    return (
        <span className={`logo ${styles.logoCowork} ${styles.logoCoworkTitle}`}>
            <DomaMark size={30} />
            {title && (
                <Typography.Title level={3} type='primary'>
                    {title}
                </Typography.Title>
            )}
        </span>
    )
}

// Large faded outline watermark for the welcome screen background.
// Rendered only on chat/new (disappears when the user sends the first message).
export const DomaWatermark: React.FC = () => (
    <div className={styles.welcomeWatermark} aria-hidden='true'>
        <svg width='100%' height='100%' viewBox='0 0 30 32' fill='none' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMidYMid meet'>
            <path fillRule='evenodd' clipRule='evenodd' d={DOMA_PATH} fill='none' stroke='currentColor' strokeWidth='0.3' />
            <circle cx='25.6618' cy='4.23655' r='4.07053' fill='none' stroke='currentColor' strokeWidth='0.3' />
        </svg>
    </div>
)
