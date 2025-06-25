import { Layout, PageHeader as AntPageHeader, PageHeaderProps } from 'antd'
import MenuItem from 'antd/lib/menu/MenuItem'
import classnames from 'classnames'
import Router from 'next/router'
import React, { CSSProperties, FunctionComponent, ElementType } from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { SideNav } from './components/SideNav'
import {
    LAYOUT_CSS,
    PAGE_CONTENT_CSS,
    PAGE_HEADER_CSS,
    SPACED_PAGE_HEADER_CSS,
    StyledPageWrapper,
    SUB_LAYOUT_CSS,
    TABLE_PAGE_CONTENT_CSS,
} from './components/styles'
import { ITopMenuItemsProps } from './components/TopMenuItems'
import { Header } from './Header'

interface IBaseLayoutProps {
    headerAction?: ElementType<unknown>
    style?: CSSProperties
    className?: string
    menuDataRender?: () => MenuItem[]
    TopMenuItems?: React.FC<ITopMenuItemsProps>
    logoLocation?: string
    menuData?: React.ElementType
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

    return (
        <Layout className={className} style={style} css={LAYOUT_CSS}>
            <SideNav menuData={menuData} onLogoClick={onLogoClick}/>
            <Layout css={SUB_LAYOUT_CSS}>
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

const PageWrapper: FunctionComponent<IPageWrapperProps> = (props) => {
    const { children, className, style } = props
    const { breakpoints } = useLayoutContext()

    return (
        <StyledPageWrapper isSmall={!breakpoints.TABLET_LARGE} className={classnames('page-wrapper', className)} style={style}>
            {children}
        </StyledPageWrapper>
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
            className={classnames('page-header', className)} css={spaced ? SPACED_PAGE_HEADER_CSS : PAGE_HEADER_CSS} style={style}
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
        <div className={classnames('page-content', className)} css={PAGE_CONTENT_CSS} style={style}>
            {children}
        </div>
    )
}

const TablePageContent: FunctionComponent<IPageContentProps> = ({ children, className, style }) => {
    return (
        <div className={classnames('page-content', className)} css={TABLE_PAGE_CONTENT_CSS} style={style}>
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
