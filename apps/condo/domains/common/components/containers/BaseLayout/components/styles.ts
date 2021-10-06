import { colors, shadows } from '@condo/domains/common/constants/style'
const { red } = require('@ant-design/colors')
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import { Layout, Menu } from 'antd'

export const SIDE_MENU_WIDTH = 256
export const COLLAPSED_SIDE_MENU_WIDTH = 92

// Ant inputs
export const formInputFixCss = css`
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

export const sideMenuStyles = css`
  position: fixed;
  padding: 40px 0 60px;
  box-sizing: border-box;
  height: 100vh;
  z-index: 10;
  border-width: 0 1px 0 0;
  border-color: ${colors.lightGrey[5]};
  border-style: solid;
`

export const MenuItemsContainer = styled.div`
    overflow-x: hidden;
    height: 100%;
    padding: 0 34px 100px;
`

export const LogoContainer = styled.div`
  margin: 0 auto;
  padding: 0 34px 40px;
`

export const ActionsContainer = styled.div<{ minified: boolean }>`
  display: flex;
  justify-content: center;
  padding: 0 34px 38px;
`

export const LayoutTriggerWrapper = styled.div`
  position: absolute;
  border-radius: 50%;
  box-shadow: ${shadows.elevated};
  font-size: 10px;
  top: 32px;
  right: -12px;
`

export const TopMenuItem = styled.div`
  display: inline-block;
  height: 100%;
  padding: 0 24px;
  cursor: pointer;
  transition: all 0.3s;
  > i {
    vertical-align: middle;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.025);
  }
  .avatar {
    margin-right: 8px;
  }
`

export const menuIconStyles = {
    color: colors.black,
    fontSize: '24px',
}

export const StyledMenuItem = styled(Menu.Item)`
  border-bottom: 1px solid ${colors.defaultWhite[6]};
  padding: 14px 0;
  font-size: 14px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  &:first-of-type {
    padding: 0 0 14px;
  }

  &:last-of-type {
    border-bottom: none;
    padding: 14px 0 0;
  }

  &:hover {
    background-color: ${colors.defaultWhite[5]};
    font-weight: 700;
  }
`

export const layoutCss = css`
  height: 100%;
  display: flex;
  align-items: stretch;
`

export const subLayoutCss = css`
  width: 100%;
  display: flex;
  align-items: stretch;
  background-color: ${colors.white};
`

export const topMenuCss = css`
  z-index: 9;
  background: ${colors.white};
  width: 100%;
  padding: 20px 48px;
  height: auto;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  line-height: 100%;
`

interface IPageWrapper {
    isSmall: boolean
}

export const StyledPageWrapper = styled(Layout.Content)<IPageWrapper>`
  padding: ${({ isSmall }) => isSmall ? '20px 20px 0' : '20px 48px 0'};
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
`

export const pageHeaderCss = css`
  padding: 0 0 40px;
  background: ${colors.white};
`

export const pageContentCss = css`
  flex-grow: 1;
  max-width: 1200px;
  padding-bottom: 56px;
  background: ${colors.white};
`
