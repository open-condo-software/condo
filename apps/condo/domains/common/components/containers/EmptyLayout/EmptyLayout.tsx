import { Layout } from 'antd'
import classnames from 'classnames'
import React, { CSSProperties } from 'react'

import styles from '@condo/domains/common/components/containers/BaseLayout/BaseLayout.module.css'

interface IBaseLayoutProps {
    style?: CSSProperties
    className?: string
}

const EmptyLayout: React.FC<React.PropsWithChildren<IBaseLayoutProps>> = (props) => {
    const {
        style,
        children,
        className,
    } = props

    return (
        <Layout className={classnames(styles.layout, className)} style={style}>
            <Layout className={styles.emptySubLayout}>
                {children}
            </Layout>
        </Layout>
    )
}

export default EmptyLayout
