import { grey } from '@ant-design/colors'
import { colors } from '../../../constants/style'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import { Menu } from 'antd'

export const SIDE_MENU_WIDTH = 256

const shadow = css`
  box-shadow: 0 9px 28px 8px rgba(0, 0, 0, 0.05), 0 3px 6px -4px rgba(0, 0, 0, 0.12);
  filter: drop-shadow(0px 6px 16px rgba(0, 0, 0, 0.08));
`

export const sideMenuMobileCss = css`
  padding: 20px 10px 0 20px;
  z-index: 10;
  min-height: 100%;
  ${shadow}
`

export const sideMenuDesktopCss = css`
  padding: 40px 10px 0 40px;
  box-sizing: border-box;
  width: ${SIDE_MENU_WIDTH}px;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  ${shadow}
`

export const substrateDesktopCss = css`
  width: ${SIDE_MENU_WIDTH}px;
  min-height: 100%;
`

export const MenuItem = styled.span`
  cursor: pointer;
  padding: 16px 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  vertical-align: center;

  .label {
    padding-left: 20px;
    font-size: 16px;
    transition: all 0.3s;
  }

  .icon {
    color: ${colors.lightGrey[5]};
    font-size: 20px;
    transition: all 0.3s;
  }

  &:hover {
    .icon {
      color: ${colors.black};
    }
  }

  &.active {
    .label {
      font-weight: 700;
    }

    .icon {
      color: ${colors.black};
    }
  }
`

export const ItemContainer = styled.div`
  padding-top: 42px;
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

  @media (max-width: 768px) {
    padding: 0 12px;
  }
  @media (max-width: 480px) {
    .name {
      display: none;
    }
    .avatar {
      margin-right: 0;
    }
    .tag {
      display: none;
    }
    .ellipsable180 {
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`

export const UserInfoWrapper = styled.div`
  padding-left: 44px;
`

export const UserInfoContainer = styled.div`
  height: 24px;
  width: 82px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
`

export const menuIconStyles = {
    color: colors.lightGrey[5],
    fontSize: '24px',
}

export const StyledMenu = styled(Menu)`
  padding: 20px;
  width: 210px;
  box-sizing: border-box;
  transform: translate(-5%, 10px);
`

export const StyledMenuItem = styled(Menu.Item)`
  border-bottom: 1px solid ${colors.defaultWhite[6]};
  padding: 14px 0;
  font-size: 14px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  &:first-of-type {
    border-bottom: none;
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
`
export const topMenuCss = css`
  z-index: 9;
  background: ${colors.white};
  width: 100%;
  padding: 40px 60px;
  height: auto;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  line-height: 100%;
`
export const pageWrapperCss = css`
  margin: 0;
  padding: 0;
`
export const pageHeaderCss = css`
  margin: 0 24px 24px;
  padding: 24px;
  background: #fff;

  @media (max-width: 768px) {
    margin: 0 0 12px;
  }
  @media (max-width: 480px) {
    margin: 0 0 12px;
  }
`
export const pageContentCss = css`
  margin: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 2px;

  @media (max-width: 768px) {
    margin: 12px 0;
    border-radius: 0;
  }
  @media (max-width: 480px) {
    margin: 12px 0;
    border-radius: 0;
  }
`