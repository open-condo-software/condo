import React from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Router from 'next/router'
import Link from 'next/link'
import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'

import style from './BasicLayout.less'
import MenuHeader from './components/MenuHeader'

const LayoutLoader = () => {
    const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin/>
    return (
        <div className={style.layoutLoaderContainer}>
            <Spin indicator={antIcon} tip="Loading..."/>
        </div>
    )
}

const DynamicBasicLayout = dynamic(() => {
    const Component = import('@ant-design/pro-layout')
    import('../../styles/overwrite.less')  // load after Layout
    return Component
}, {
    ssr: false,
    loading: () => (<LayoutLoader/>),
})

const BasicLayout = (props) => {
    return (<>
        <Head>
            <title>ADMIN</title>
            <link rel="icon" href="/favicon.ico"/>
            <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
        </Head>
        <DynamicBasicLayout
            title={null}
            logo="/logo.colored.svg"
            navTheme="dark"
            // menu={{ locale: true }}
            siderWidth={256}
            onMenuHeaderClick={e => {
                e.stopPropagation()
                e.preventDefault()
                Router.push('/')
            }}
            menuDataRender={props.menuDataRender}
            menuItemRender={(menuItemProps, defaultDom) => {
                if (menuItemProps.isUrl || menuItemProps.children) {
                    return defaultDom
                }
                return <Link href={menuItemProps.path}><a>{defaultDom}</a></Link>
            }}
            rightContentRender={() => (<MenuHeader/>)}
        >
            {props.children}
        </DynamicBasicLayout>
    </>)
}

export default BasicLayout
