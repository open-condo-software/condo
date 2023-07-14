import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Layout } from 'antd'

import { colors, MAX_CONTENT_WIDTH } from '@condo/domains/common/constants/style'

const { red } = require('@ant-design/colors')

export const SIDE_MENU_WIDTH = 256
export const COLLAPSED_SIDE_MENU_WIDTH = 92

// Ant inputs
export const FROM_INPUT_CSS = css`
  body {
    height: 100%
  }

  .ant-input-affix-wrapper:focus,
  .ant-input-affix-wrapper-focused,
  .ant-form-item-has-error .ant-input-affix-wrapper:focus,
  .ant-form-item-has-error .ant-input-affix-wrapper-focused {
    background-color: ${colors.white};
  }

  .ant-input-affix-wrapper > input.ant-input,
  .ant-form-item-has-error .ant-input-affix-wrapper > input.ant-input {
    -webkit-box-shadow: inset 0 0 0 50px ${colors.ultraLightGrey};
    -webkit-text-fill-color: ${colors.black};
  }

  .ant-form-item-has-error .ant-input-affix-wrapper > input.ant-input:focus,
  .ant-input-affix-wrapper > input.ant-input:focus {
    -webkit-box-shadow: inset 0 0 0 50px ${colors.white};
    -webkit-text-fill-color: ${colors.black};
    background-color: ${colors.white};
  }

  .ant-form-item-has-error .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):hover {
    border-color: ${red[5]};
  }

  .ant-form-item-has-error .ant-input-affix-wrapper-focused:hover,
  .ant-form-item-has-error .ant-input-affix-wrapper:focus:hover {
    border-color: ${red[5]};
    background-color: ${colors.white};
  }

  .ant-input:focus:hover, .ant-input:active:hover {
    background-color: ${colors.white};
  }
`

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
`

export const SUB_LAYOUT_CSS = css`
  width: 100%;
  display: flex;
  align-items: center;
  background-color: ${colors.white};
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
  padding: 0 0 40px;
  background: ${colors.white};

  .ant-page-header-heading {
    align-items: center;
  }

  & .ant-page-header-heading-title {
    white-space: normal;
  }
`

export const SPACED_PAGE_HEADER_CSS = css`
  padding: 0 0 60px;
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
