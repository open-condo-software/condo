/** @jsx jsx */
import * as React from "react";
import {jsx} from '@emotion/core'
import styled from "@emotion/styled";
import {Dropdown, Menu, Spin} from 'antd'
import {useIntl} from 'react-intl'
import {HeartOutlined, HomeOutlined, LogoutOutlined, MessageOutlined} from '@ant-design/icons'
import {useAuth} from '@core/next/auth'
import Router from "next/router";

import {CustomAvatar} from "../CustomAvatar";
import {customAvatar, headerRightWrapper, addition_menu_style} from "./styles"

const UserInfo = () => {
    // TODO(ddanev):it seems like we have incorrectly implemented dropdown,
    //  needs to rework this and drop the menu usage into dropdown overlay
    const auth = useAuth();
    const intl = useIntl();

    const menu = (
        <Menu>
            <Menu.Item key="signout" onClick={auth.signout}>
                <LogoutOutlined/>
                {intl.formatMessage({id: 'SignOut'})}
            </Menu.Item>
        </Menu>
    );

    return (
        <Dropdown overlay={menu} trigger={['click']}>
            {/*FIXME(ddanev): dropdown doesn't work without this div wrapper*/}
            <div css={customAvatar}>
                <CustomAvatar auth={auth}/>
            </div>
        </Dropdown>
    )
};

// TODO: rework this awful stylisation of menu header (write custom header component);
const IconContainer = styled.div`
    position: relative;
    
    ${props => props.active && `
        &:after {
            content: "";
            display: block;
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #fff;
            bottom: 10px;
            margin-left: -3px;
            left: 10px;
        };
    `}
`;

export class MenuHeader extends React.Component {
    state = {
        active: "home"
    };

    render() {
        if (this.props.loading) {
            return (
                <div css={headerRightWrapper}>
                    <Spin size="small" style={{ marginLeft: 16, marginRight: 16 }}/>
                </div>
            )
        }

        return (
            <div css={headerRightWrapper}>
                <Menu
                    onClick={this.handleMenuItemClick}
                    selectedKeys={[this.state.active]}
                    mode="horizontal"
                    style={addition_menu_style}
                >
                    {this.renderMenuItems()}
                </Menu>
                <UserInfo/>
            </div>
        )
    }

    handleMenuItemClick = (e) => {
        this.setState({ active: e.key }, () => {
            const route_config = this.routes_config.find(({key}) => key === e.key);

            if (!route_config) {
                return;
            }

            Router.push(route_config.route);
        });
    };

    renderMenuItems() {
        return this.routes_config.map((menuItem) => {
            const {key} = menuItem;

            return (
                <Menu.Item
                    style={{
                        borderBottom: "none",
                    }}
                    key={key}
                    icon={menuItem.icon(key === this.state.active)}
                />
            )
        })
    }

    icon_style = {
        fontSize: "22px",
        color: "#fff",
    };

    routes_config = [
        {
            key: "home",
            title: "Home",
            icon: (active) => (
                <IconContainer active={active}>
                    <HomeOutlined style={this.icon_style}/>
                </IconContainer>
            ),
            route: "/",
        },
        {
            key: "matches",
            title: "Matches",
            icon: (active) => (
                <IconContainer active={active}>
                    <HeartOutlined style={this.icon_style}/>
                </IconContainer>
            ),
            route: "/matches",
        },
        {
            key: "messages",
            title: "Messages",
            icon: (active) => (
                <IconContainer active={active}>
                    <MessageOutlined style={this.icon_style}/>
                </IconContainer>
            ),
            route: "/messages",
        },
    ];
}
