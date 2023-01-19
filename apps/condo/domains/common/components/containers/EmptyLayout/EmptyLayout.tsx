/** @jsx jsx */
import { jsx } from '@emotion/react'
import React, { CSSProperties } from 'react'
import { Layout } from 'antd'
import {
    LAYOUT_CSS,
    SUB_LAYOUT_CSS,
} from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import 'antd/dist/antd.less'

interface IBaseLayoutProps {
    style?: CSSProperties
    className?: string
}

const EmptyLayout: React.FC<IBaseLayoutProps> = (props) => {
    const {
        style,
        children,
        className,
    } = props

    return (
        <Layout className={className} style={style} css={LAYOUT_CSS}>
            <Layout css={SUB_LAYOUT_CSS}>
                {children}
            </Layout>
        </Layout>
    )
}

export default EmptyLayout
