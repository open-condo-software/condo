/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Dropdown, Menu, Spin } from 'antd'
import { useIntl } from 'react-intl'
import { LogoutOutlined } from '@ant-design/icons'
import Router from 'next/router'

import { useAuth } from '@core/next/auth'
import { CustomAvatar } from "../CustomAvatar";
import { headerRightWrapper, headerItem, customAvatar } from "./styles"

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

export { MenuHeader }
