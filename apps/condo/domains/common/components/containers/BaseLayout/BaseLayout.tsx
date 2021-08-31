/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { createContext, CSSProperties, FunctionComponent, useContext } from 'react'
import { Layout, PageHeader as AntPageHeader, PageHeaderProps } from 'antd'
import { useTopNotificationsHook, ITopNotification } from '@condo/domains/common/components/TopNotifications'
import { detectMobileNavigator } from '@condo/domains/common/utils/navigator'
import { useResponsive } from '../../../hooks/useResponsive'
import { SideMenu } from './components/SideMenu'
import Router from 'next/router'
import classnames from 'classnames'
import 'antd/dist/antd.less'
import { layoutCss, pageContentCss, pageHeaderCss, StyledPageWrapper, subLayoutCss } from './components/styles'
import { ElementType } from 'react'
import MenuItem from 'antd/lib/menu/MenuItem'
import { Header } from './Header'
import { ITopMenuItemsProps } from './components/TopMenuItems'

interface ILayoutContext {
    isMobile: boolean
    addNotification: (notification: ITopNotification) => void
}

const LayoutContext = createContext<ILayoutContext>({
    isMobile: false,
    addNotification: () => null,
})

const useLayoutContext = (): ILayoutContext => useContext<ILayoutContext>(LayoutContext)

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

    const {
        TopNotificationComponent,
        addNotification,
    } = useTopNotificationsHook()

    const menuDataClassNames = classnames(
        'layout',
        { 'hided-side-menu': !menuData || menuData.length === 0 },
        className
    )

    return (
        <LayoutContext.Provider value={{ isMobile: detectMobileNavigator(), addNotification }}>
            <TopNotificationComponent />
            <Layout className={menuDataClassNames} style={style} css={layoutCss} >
                <SideMenu {...{ onLogoClick, menuData }}/>
                <Layout css={subLayoutCss}>
                    <Header headerAction={headerAction} TopMenuItems={TopMenuItems} />
                    {children}
                </Layout>
            </Layout>
        </LayoutContext.Provider>
    )
}

interface IPageWrapperProps {
    className?: string
    style?: CSSProperties
}

const PageWrapper: FunctionComponent<IPageWrapperProps> = ({ children, className, style }) => {
    const { isSmall } = useResponsive()

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
