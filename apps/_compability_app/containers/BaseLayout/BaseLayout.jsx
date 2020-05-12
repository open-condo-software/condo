/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Layout } from 'antd'
import Router from 'next/router'

import MenuHeader from './components/MenuHeader'

const { Header, Content } = Layout
const layoutCss = css`
    height: 100%;
`

const topMenuWrapperCss = css`
`

const mainContentWrapperCss = css`
`

const topMenuCss = css`
    background: #fff;
    padding: 0;
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
    min-width: 100%;
`

const mainContentCss = css`
    margin: 16px;
    padding: 24px;
    min-height: 280px;
    background: white;
    border-radius: 2px;
`

const logoTopCss = css`
    height: 64px;
    margin: 0 16px;
    cursor: pointer;
`

function BaseLayout (props) {
    const logo = props.logo || 'sideMenu'
    const handleLogoClick = () => {
        Router.push('/')
    }

    return (
        <Layout css={layoutCss} as="section">
            <Layout css={topMenuWrapperCss} style={props.topMenuWrapperStyle}>
                <Header css={topMenuCss} style={props.topMenuStyle}>
                    {logo === 'topMenu' ? <img css={logoTopCss} src="/logo.svg" onClick={handleLogoClick}/> : null}
                    <MenuHeader/>
                    {/*<div css={trigger} onClick={toggleCollapsed}>*/}
                    {/*    {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {})}*/}
                    {/*</div>*/}
                </Header>
                <Content css={mainContentWrapperCss} as="div" style={props.mainContentWrapperStyle}>
                    <div css={mainContentCss} as="main" style={props.mainContentStyle}>
                        {props.children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default BaseLayout
