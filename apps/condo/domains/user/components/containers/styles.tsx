import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { Layout as AntLayout } from 'antd'

interface IFooterProps {
    isSmall: boolean
}

export const Footer = styled.div<IFooterProps>`
  ${({ isSmall }) => isSmall
        ? `
            position: absolute;
            bottom: 0px;
          `
        : `
            bottom: 8%;
            position: fixed;
          `
}
  width: 100%;
  color: ${colors.lightGrey[7]};
  white-space: pre-line;
  font-size: 12px;
  line-height: 20px;
  background-color: inherit;
  margin-top: 5px;
  margin-left: 5%;
`

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
  padding: 20px 20px 0 20px ;
`

export const ActionContainer = styled.div`
  display: flex;
  justify-content: center;
`

export const PosterWrapper = styled.div`
  height: 90%;
  background-color: ${colors.backgroundLightGrey};
  border-radius: 22px;
  width: 47%;
  position: fixed;
  margin: 36px 0 36px 36px
`

interface IContentProps {
    isSmall: boolean
}

export const PageContent = styled.div<IContentProps>`
  display: flex;
  overflow: hidden;
  overflow-y: scroll;
`

export const Layout = styled(AntLayout)`
  background: ${colors.white};
`

interface IChildrenWrapperProps {
    isSmall: boolean
}

export const ChildrenWrapper = styled.div<IChildrenWrapperProps>`
  margin: ${({ isSmall }) => isSmall ? 'inherit' : 'auto'};
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: ${({ isSmall }) => isSmall ? 'flex-start' : 'center'};
  min-height: 95vh;
  padding: 0 20px;
  width: 100%;
`
