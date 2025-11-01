import { Layout, PageHeader as AntPageHeader, PageHeaderProps } from 'antd'
import MenuItem from 'antd/lib/menu/MenuItem'
import classnames from 'classnames'
import Router from 'next/router'
import React, { CSSProperties, FunctionComponent, ElementType } from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import styles from './BaseLayout.module.css'
import { SideNav } from './components/SideNav'
import { ITopMenuItemsProps } from './components/TopMenuItems'
import { Footer } from './Footer'
import { Header } from './Header'


interface IBaseLayoutProps {
    headerAction?: ElementType<unknown>
    style?: CSSProperties
    className?: string
    menuDataRender?: () => MenuItem[]
    TopMenuItems?: React.FC<ITopMenuItemsProps>
    logoLocation?: string
    menuData?: React.ReactNode
    onLogoClick?: () => void
}

const BaseLayout: React.FC<React.PropsWithChildren<IBaseLayoutProps>> = (props) => {
    const {
        style,
        children,
        className,
        menuData,
        headerAction,
        onLogoClick = () => Router.push('/'),
        TopMenuItems,
    } = props

    const { isCollapsed } = useLayoutContext()

    return (
        <Layout className={classnames(styles.layout, className)} style={style}>
            <SideNav menuData={menuData} onLogoClick={onLogoClick}/>
            <Layout 
                className={classnames(
                    styles.subLayout,
                    isCollapsed ? styles.subLayoutCollapsed : styles.subLayoutExpanded
                )}
            >
                <Header headerAction={headerAction} TopMenuItems={TopMenuItems} />
                {children}
                <Footer />
            </Layout>
        </Layout>
    )
}

interface IPageWrapperProps {
    className?: string
    style?: CSSProperties
}

const PageWrapper: FunctionComponent<React.PropsWithChildren<IPageWrapperProps>> = (props) => {
    const { children, className, style } = props

    return (
        <Layout.Content 
            className={classnames(
                styles.pageWrapper,
                'page-wrapper',
                className
            )} 
            style={style}
        >
            {children}
        </Layout.Content>
    )
}

interface IPageHeaderProps extends PageHeaderProps {
    title?: React.ReactChild
    subTitle?: string
    className?: string
    style?: CSSProperties
    spaced?: boolean
}

const PageHeader: FunctionComponent<IPageHeaderProps> = ({
    children,
    className,
    style,
    title,
    subTitle,
    spaced,
    ...pageHeaderProps
}) => {
    return (
        <AntPageHeader
            className={classnames(
                spaced ? styles.spacedPageHeader : styles.pageHeader,
                'page-header',
                className
            )} 
            style={style}
            title={title} 
            subTitle={subTitle}
            {...pageHeaderProps}
        >
            {children}
        </AntPageHeader>
    )
}

interface IPageContentProps {
    className?: string
    style?: CSSProperties
}

const PageContent: FunctionComponent<React.PropsWithChildren<IPageContentProps>> = ({ children, className, style }) => {
    return (
        <div className={classnames(styles.pageContent, 'page-content', className)} style={style}>
            {children}
        </div>
    )
}

const TablePageContent: FunctionComponent<React.PropsWithChildren<IPageContentProps>> = ({ children, className, style }) => {
    return (
        <div className={classnames(styles.tablePageContent, 'page-content', className)} style={style}>
            {children}
        </div>
    )
}

export default BaseLayout
export {
    useLayoutContext,
    PageWrapper,
    PageHeader,
    PageContent,
    TablePageContent,
}
