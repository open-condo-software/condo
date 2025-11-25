import { Layout } from 'antd'
import React, { CSSProperties, PropsWithChildren } from 'react'
import { ElementType } from 'react'
import { useIntl } from 'react-intl'

import styles from './BaseLayout.module.css'
interface IBaseLayoutProps {
    headerAction?: ElementType<unknown>
    style?: CSSProperties
    className?: string
    logoLocation?: string
    menuData?: React.ElementType
    onLogoClick?: () => void
}

const BaseLayout: React.FC<IBaseLayoutProps & PropsWithChildren> = (props) => {
    const {
        style,
        children,
        className,
    } = props
    const intl = useIntl()

    return (
        <Layout className={styles.baseLayout}>

            <main style={style} className={className}>
                {children}
            </main>
        </Layout>
    )
}

export {
    BaseLayout,
}
