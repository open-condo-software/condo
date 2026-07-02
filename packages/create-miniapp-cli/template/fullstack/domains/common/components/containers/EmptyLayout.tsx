import { Layout } from 'antd'
import React, { CSSProperties } from 'react'

interface IBaseLayoutProps {
    style?: CSSProperties
    className?: string
}

const layoutStyle: CSSProperties = {
    height: '100%',
    display: 'flex',
    alignItems: 'stretch',
    flexDirection: 'row',
}

const subLayoutStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'stretch',
    backgroundColor: '#fff',
}

const EmptyLayout: React.FC<React.PropsWithChildren<IBaseLayoutProps>> = (props) => {
    const {
        style,
        children,
        className,
    } = props

    return (
        <Layout
            className={className}
            style={{ ...layoutStyle, ...style }}
        >
            <Layout style={subLayoutStyle}>
                {children}
            </Layout>
        </Layout>
    )
}

export default EmptyLayout
