import { Layout } from 'antd'
import React, { CSSProperties } from 'react'

import {
    EMPTY_SUB_LAYOUT_CSS,
    LAYOUT_CSS,
} from '@condo/domains/common/components/containers/BaseLayout/components/styles'

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
        <Layout className={className} style={style} css={LAYOUT_CSS}>
            <Layout css={EMPTY_SUB_LAYOUT_CSS}>
                {children}
            </Layout>
        </Layout>
    )
}

export default EmptyLayout
