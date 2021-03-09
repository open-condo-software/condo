import { css } from '@emotion/core'
import styled from '@emotion/styled'

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
  }

  .icon {
    color: #D9D9D9;
    font-size: 20px;
  }

  &:hover {
    .icon {
      color: #000;
    }
  }

  &.active {
    .label {
      font-weight: 700;
    }

    .icon {
      color: #000;
    }
  }
`

export const ItemContainer = styled.div`
  padding-top: 42px;
`

export const TopMenuLeftWrapper = styled.div`
  float: left;
  height: 100%;
  overflow: hidden;
`

export const TopMenuRightWrapper = styled.div`
  float: right;
  height: 100%;
  margin-left: auto;
  overflow: hidden;
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