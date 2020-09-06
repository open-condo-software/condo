/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Dropdown, Menu, Spin } from 'antd'
import { useIntl } from 'react-intl'
import { LogoutOutlined } from '@ant-design/icons'
import Router from 'next/router'

import { useAuth } from '@core/next/auth'
import {CustomAvatar} from "./CustomAvatar";

const headerRightWrapper = css`
    display: flex;
    flex-direction: row;
    justify_content: space-between;
    max-width: 1024px;
    margin:auto;
    height: 100%;
    overflow: hidden;
`

const headerItem = css`
    display: inline-block;
    height: 100%;
    padding: 0 16px;
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
`;

const customAvatar = css`
    ${headerItem};
    margin-left: auto;
`;

const MenuHeader = ({ loading }) => {
    if (loading) {
        return (
            <div css={headerRightWrapper}>
                <Spin size="small" style={{ marginLeft: 16, marginRight: 16 }}/>
            </div>
        )
    }

    const auth = useAuth();
    const intl = useIntl();

    const menu = (
        <Menu>
            <Menu.Item key="signout" onClick={auth.signout}>
                <LogoutOutlined/>
                {intl.formatMessage({id: 'SignOut'})}
            </Menu.Item>
        </Menu>
    )


    return (
        <div css={headerRightWrapper}>
            {
                auth.isAuthenticated
                    ?  (
                        <Dropdown overlay={menu} trigger={['click']}>
                            {/*FIXME(ddanev): dropdown doesn't work without this div wrapper*/}
                            <div css={customAvatar}>
                                <CustomAvatar auth={auth}/>
                            </div>
                        </Dropdown>)
                    : (
                        <div css={headerItem} onClick={() => Router.push('/auth/signin')}>
                            <span className="name">
                                {intl.formatMessage({id: 'SignIn'})}
                            </span>
                        </div>
                    )
            }
        </div>
    )
}

export default MenuHeader
