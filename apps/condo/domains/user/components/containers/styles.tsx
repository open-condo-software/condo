import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { Layout as AntLayout, PageHeader } from 'antd'

interface IFooterProps {
    isSmall: boolean
}

export const Footer = styled.div<IFooterProps>`
  ${({ isSmall }) => isSmall
        ? `
            position: absolute;
            bottom: 400px;
          `
        : `
            margin-left: 5%;
            bottom: 8%;
          `
}
  width: 100%;
  color: ${colors.lightGrey[7]};
  white-space: pre-line;
  font-size: 12px;
  line-height: 20px;
  background-color: inherit;
  margin-top: 5px;
  position: fixed;
`

export const Header = styled<typeof PageHeader>(PageHeader)`
  position: fixed;
  background: transparent;
  width: 100%;
  z-index: 1;
  pointer-events: none;
  padding: 50px 10px 40px 60px;
`

export const MobileHeader = styled.div`
  background: ${colors.backgroundLightGrey};
  display: flex;
  flex-direction: column;
  width: 100%;
  z-index: 1;
`

export const ActionContainer = styled.div`
  display: flex;
  justify-content: center;
`

export const PosterWrapper = styled.div`
  height: 90%;
  background-color: ${colors.backgroundLightGrey};
  border-radius: 22px;
  width: 50%;
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
