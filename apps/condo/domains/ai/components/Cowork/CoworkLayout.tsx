import { useRouter } from 'next/router'
import React from 'react'

import { TopMenuItems } from '@condo/domains/common/components/containers/BaseLayout/components/TopMenuItems'

import styles from './Cowork.module.css'

type CoworkLayoutProps = React.PropsWithChildren<{ headerAction?: React.ElementType }>

export const CoworkLayout: React.FC<CoworkLayoutProps> = ({ children, headerAction }) => {
    const router = useRouter()

    return (
        <div className={styles.coworkLayout}>
            <div className={styles.coworkHeader}>
                <div className={styles.coworkHeaderLeft}>
                    <div className={styles.coworkLogo}>
                        Doma.ai <span className={styles.coworkLogoItalic}>Cowork</span>
                    </div>
                </div>
                <div className={styles.coworkHeaderRight}>
                    <TopMenuItems headerAction={headerAction} hideAIButton />
                </div>
            </div>
            {children}
        </div>
    )
}
