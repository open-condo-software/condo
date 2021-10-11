/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { CSSProperties, FunctionComponent } from 'react'
import { Layout, PageHeader as AntPageHeader, PageHeaderProps } from 'antd'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { SideNav } from './components/SideNav'
import Router from 'next/router'
import classnames from 'classnames'
import 'antd/dist/antd.less'
import { layoutCss, pageHeaderCss, StyledPageWrapper, subLayoutCss, PageContentWrapper } from './components/styles'
import { ElementType } from 'react'
import MenuItem from 'antd/lib/menu/MenuItem'
import { Header } from './Header'

interface IBaseLayoutProps {
    headerAction?: ElementType<unknown>
    style?: CSSProperties
    className?: string
    menuDataRender?: () => MenuItem[]
    TopMenuItems?: React.FC
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
        <Layout className={className} style={style} css={layoutCss}>
            <SideNav menuData={menuData} onLogoClick={onLogoClick}/>
            <Layout css={subLayoutCss}>
                <Header headerAction={headerAction} TopMenuItems={TopMenuItems} />
                {children}
            </Layout>
        </Layout>
    )
}


const PageWrapper: FunctionComponent = ({ children}) => {
    const { isSmall } = useLayoutContext()

    return (
        <StyledPageWrapper isSmall={isSmall}>
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

const PageContent: React.FC = ({ children }) => {
    const { breakpoints } = useLayoutContext()

    return (
        <PageContentWrapper breakpoints={breakpoints}>
            {children}
        </PageContentWrapper>
    )
}

export default BaseLayout
export {
    useLayoutContext,
    PageWrapper,
    PageHeader,
    PageContent,
}
