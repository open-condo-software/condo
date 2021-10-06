/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { CSSProperties, FunctionComponent } from 'react'
import { Layout, PageHeader as AntPageHeader, PageHeaderProps } from 'antd'
import { useLayoutContext } from '../../LayoutContext'
import { DesktopSideNav, MobileSideNav } from './components/SideNav'
import Router from 'next/router'
import classnames from 'classnames'
import 'antd/dist/antd.less'
import { layoutCss, pageContentCss, pageHeaderCss, StyledPageWrapper, subLayoutCss } from './components/styles'
import { ElementType } from 'react'
import MenuItem from 'antd/lib/menu/MenuItem'
import { Header } from './Header'
import { ITopMenuItemsProps } from './components/TopMenuItems'

interface IBaseLayoutProps {
    headerAction?: ElementType<unknown>
    menuData?: React.ElementType
    style?: CSSProperties
    className?: string
    menuDataRender?: () => MenuItem[]
    TopMenuItems?: React.FC<ITopMenuItemsProps>
    logoLocation?: string
    onLogoClick?: () => void
}

const BaseLayout: React.FC<IBaseLayoutProps> = (props) => {
    const {
        style,
        children,
        className,
        menuData,
        headerAction,
        onLogoClick = () => Router.push('/'),
        TopMenuItems,
    } = props

    const { isSmall } = useLayoutContext()

    return (
        <Layout className={className} style={style} css={layoutCss} >
            {
                isSmall
                    ? <MobileSideNav menuData={menuData}/>
                    : <DesktopSideNav onLogoClick={onLogoClick} menuData={menuData}/>
            }
            <Layout css={subLayoutCss}>
                <Header headerAction={headerAction} TopMenuItems={TopMenuItems} />
                {children}
            </Layout>
        </Layout>
    )
}

interface IPageWrapperProps {
    className?: string
    style?: CSSProperties
}

const PageWrapper: FunctionComponent<IPageWrapperProps> = ({ children, className, style }) => {
    const { isSmall } = useLayoutContext()

    return (
        <StyledPageWrapper isSmall={isSmall} className={classnames('page-wrapper', className)} style={style}>
            {children}
        </StyledPageWrapper>
    )
}

interface IPageHeaderProps extends PageHeaderProps {
    title?: React.ReactChild
    subTitle?: string
    className?: string
    style?: CSSProperties
}

const PageHeader: FunctionComponent<IPageHeaderProps> = ({ children, className, style, title, subTitle, ...pageHeaderProps }) => {
    return (
        <AntPageHeader
            className={classnames('page-header', className)} css={pageHeaderCss} style={style}
            title={title} subTitle={subTitle}
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

const PageContent: FunctionComponent<IPageContentProps> = ({ children, className, style }) => {
    return (
        <div className={classnames('page-content', className)} css={pageContentCss} style={style}>
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
}
