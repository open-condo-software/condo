import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { Layout as AntLayout, PageHeader } from 'antd'

export const Layout = styled(AntLayout)`
  background: ${colors.white};
  height: 100%;
`

export const Footer = styled(AntLayout.Footer)`
  position: absolute;
  bottom: 0;
  width: 100%;
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

export const PosterWrapper = styled.div`
  height: 100vh;
`

export const PageContent = styled(AntLayout.Content)`
  height: 100vh;
  display: flex;
  overflow: hidden;
  overflow-y: scroll;
`

export const ChildrenWrapper = styled.div`
  margin: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 900px;
`
