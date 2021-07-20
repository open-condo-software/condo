import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { Layout as AntLayout, PageHeader } from 'antd'

export const Layout = styled(AntLayout)`
  background: ${colors.white};
  height: 100%;
`

export const Footer = styled(AntLayout.Footer)`
  white-space: pre;
  color: ${colors.lightGrey[7]}; 
  background-color: ${colors.white}; 
  font-size: 12px; 
  line-height: 20px;  
  padding: 0 0 60px;
`

export const Header = styled<typeof PageHeader>(PageHeader)`
  position: fixed;
  background: transparent; 
  padding: 20px; 
  margin: 0;
  width: 100%;
  z-index: 1;
`

export const PageContent = styled(AntLayout.Content)`
`

export const PosterWrapper = styled.div`
  height: 100vh;
`

export const ChildrenWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`
