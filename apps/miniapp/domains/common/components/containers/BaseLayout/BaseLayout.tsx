import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Layout } from 'antd'
import classnames from 'classnames'
import React, { CSSProperties, FunctionComponent } from 'react'

import { colors } from '@open-condo/ui/dist/colors'

import { MAX_CONTENT_WIDTH } from '@miniapp/domains/common/constants/style'


const LAYOUT_CSS = css`
  height: 100%;
  display: flex;
  align-items: stretch;
  position: relative;
`

const SUB_LAYOUT_CSS = css`
  width: 100%;
  display: flex;
  align-items: stretch;
  background: ${colors.white};
`

const PAGE_CONTENT_CSS = css`
  flex-grow: 1;
  max-width: 1600px;
  background: ${colors.white};
`

const PAGE_HEADER_CSS = css`
  padding: 0 0 40px;
  background: ${colors.white};
`

export const TABLE_PAGE_CONTENT_CSS = css`
  flex-grow: 1;
  max-width: ${MAX_CONTENT_WIDTH}px;
  background: ${colors.white};
`

const StyledPageWrapper = styled(Layout.Content)`
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 4px 4px;
`

interface IBaseLayoutProps {
    style?: CSSProperties
    className?: string
}

const BaseLayout: React.FC<IBaseLayoutProps> = (props) => {
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

interface IPageHeaderProps {
    className?: string
}

const PageHeader: FunctionComponent<IPageHeaderProps> = ({
    className,
    children,
}) => {
    return (
        <div css={PAGE_HEADER_CSS} className={classnames('page-header', className)}>
            {children}
        </div>
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

export {
    BaseLayout,
    PageWrapper,
    PageHeader,
    PageContent,
    TablePageContent,
}
