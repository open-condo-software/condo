/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Layout, PageHeader as AntPageHeader, PageHeaderProps } from 'antd'
import classnames from 'classnames'
import React, { CSSProperties, FunctionComponent } from 'react'
import { ElementType } from 'react'

import { useLayoutContext } from './LayoutContext'
import 'antd/dist/antd.less'

const layoutCss = css`
  height: 100%;
  display: flex;
  align-items: stretch;
`

const subLayoutCss = css`
  width: 100%;
  display: flex;
  align-items: stretch;
  background-color: #fff;
`

const pageContentCss = css`
  flex-grow: 1;
  max-width: 1200px;
  padding-bottom: 56px;
  background: #fff;
`

const pageHeaderCss = css`
  padding: 0 0 40px;
  background: #fff;
`

const StyledPageWrapper = styled(Layout.Content)`
  padding: 20px 20px 0;
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
`

interface IBaseLayoutProps {
    headerAction?: ElementType<unknown>
    style?: CSSProperties
    className?: string
    logoLocation?: string
    menuData?: React.ElementType
    onLogoClick?: () => void
}

const BaseLayout: React.FC<IBaseLayoutProps> = (props) => {
    const {
        style,
        children,
        className,
    } = props

    return (
        <Layout className={className} style={style} css={layoutCss}>
            <Layout css={subLayoutCss}>
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

    return (
        <StyledPageWrapper className={classnames('page-wrapper', className)} style={style}>
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
    title,
    subTitle,
    ...pageHeaderProps
}) => {
    return (
        <AntPageHeader
            css={pageHeaderCss}
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

export {
    BaseLayout,
    useLayoutContext,
    PageWrapper,
    PageHeader,
    PageContent,
}
