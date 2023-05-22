import styled from '@emotion/styled'
import { Layout as AntLayout } from 'antd'

import { colors } from '@condo/domains/common/constants/style'

export const Header = styled.div`
  position: fixed;
  display: flex;
  background: transparent;
  width: 50%;
  z-index: 1;
  padding: 76px 40px 10px 76px;
`

export const MobileHeader = styled.div`
  background: ${colors.backgroundLightGrey};
  display: flex;
  flex-direction: column;
  width: 100%;
  z-index: 1;
  padding: 20px;
`

export const ActionContainer = styled.div`
  display: flex;
  justify-content: center;
`

export const PosterWrapper = styled.div`
  height: 100%;
  width: 100%;
  background-color: ${colors.backgroundLightGrey};
  border-radius: 22px;
`

export const PageContent = styled.div`
  display: flex;
  overflow: hidden;
  overflow-y: auto;
`

export const ReCaptchaContainer = styled.div`
  visibility: hidden;
  position: absolute;
  height: 0;
`

export const Layout = styled(AntLayout)`
  background: ${colors.white};
`

interface IChildrenWrapperProps {
    isSmall: boolean
}

export const ChildrenWrapper = styled.div<IChildrenWrapperProps>`
  margin: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: ${({ isSmall }) => isSmall ? 'flex-start' : 'center'};
  ${({ isSmall }) => !isSmall && 'min-height: 100vh;'}
  padding: 0 20px;
  width: 100%;
  max-width: 400px;
`

export const RequiredFlagWrapper = styled.div`
   & .ant-form-item > .ant-form-item-label > label.ant-form-item-required:not(.ant-form-item-required-mark-optional)::after{
    display: inline-block;
    margin-right: 4px;
    color: ${colors.warningText};
    font-size: 14px;
    content: '*';
  }
  & .ant-form-item > .ant-form-item-label > label.ant-form-item-required:not(.ant-form-item-required-mark-optional)::before{
    display: none;
  }
  & .ant-form-item > .ant-form-item-label > label {
    align-items: flex-end;
  }
`

export const RemoveTabsLineWrapper = styled.div`
  & .ant-tabs-nav::before {
    content: none;
  }
`
