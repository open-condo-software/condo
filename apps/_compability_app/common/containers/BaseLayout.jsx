/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Layout } from 'antd'

import { MenuHeader } from '../components'
import {useAuth} from "@core/next/auth";

const { Header, Content } = Layout;

const layoutCss = css`
    min-height: 100vh;
    background: radial-gradient(#CECECE, #fff);
`;

const topMenuCss = css`
    background: #156E8F;
    padding: 0;
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
    min-width: 100%;
    color: #fff;
`;

const mainContentCss = css`
    display:flex;
    flex-direction:column;
    margin: auto;
    padding: 24px;
    height: 100%;
    max-width: 1024px;
    background: none;
    border-radius: 2px;
`;

export function BaseLayout(props) {
    const auth = useAuth();

    return (
        <Layout css={layoutCss} as="section">
            <Layout style={props.topMenuWrapperStyle}>
                <Header css={topMenuCss} style={props.topMenuStyle}>
                    {/*TODO(ddanev): add auth header/menu*/}
                    {auth.isAuthenticated ? <MenuHeader/> : null}
                </Header>
                <Content as="div" style={props.mainContentWrapperStyle}>
                    <div css={mainContentCss} as="main" style={props.mainContentStyle}>
                        {props.children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}
