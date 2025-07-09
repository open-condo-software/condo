import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Layout } from 'antd'

import { colors, MAX_CONTENT_WIDTH } from '@condo/domains/common/constants/style'


export const SIDE_MENU_WIDTH = 256
export const COLLAPSED_SIDE_MENU_WIDTH = 92

export const MobileSideNavHeader = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: stretch;
  align-items: center;
  padding: 0 22px 40px;
`

export const MobileMenuItemsContainer = styled.div`
  padding: 0 22px 100px;
`

export const LAYOUT_CSS = css`
  height: 100%;
  display: flex;
  align-items: stretch;
  flex-direction: row;
`

export const SUB_LAYOUT_CSS = css`
  width: 100%;
  display: flex;
  align-items: center;
  background-color: ${colors.white} !important;
`
export const EMPTY_SUB_LAYOUT_CSS = css`
  width: 100%;
  display: flex;
  align-items: stretch;
  background-color: ${colors.white};
`


interface IPageWrapper {
    isSmall: boolean
}

export const StyledPageWrapper = styled(Layout.Content)<IPageWrapper>`
  padding: ${({ isSmall }) => isSmall ? '20px 20px 0' : '20px 40px 0'};
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  width: min(100%, ${MAX_CONTENT_WIDTH}px);
`

export const PAGE_HEADER_CSS = css`
  padding: 0 0 40px !important;
  background: ${colors.white};

  .ant-page-header-heading {
    align-items: center;
  }

  & .ant-page-header-heading-title {
    white-space: normal;
  }
`

export const SPACED_PAGE_HEADER_CSS = css`
  padding: 0 0 60px !important;
  background: ${colors.white};

  & .ant-page-header-heading-title {
    white-space: normal;
  }
`

export const PAGE_CONTENT_CSS = css`
  flex-grow: 1;
  padding-bottom: 60px;
  max-width: ${MAX_CONTENT_WIDTH}px;
  background: ${colors.white};
`

export const TABLE_PAGE_CONTENT_CSS = css`
  flex-grow: 1;
  padding-bottom: 60px;
  max-width: ${MAX_CONTENT_WIDTH}px;
  background: ${colors.white};
`
