/** @jsx jsx */
import { jsx } from "@emotion/core";
import styled from "@emotion/styled";
import { Avatar } from "antd"
import React from "react";
import { useIntl } from "react-intl";

const UserName = styled.span`
    padding-right: 12px;
`;

export const CustomAvatar = ({auth}) => {
    const intl = useIntl();
    const avatarUrl = (auth.user && auth.user.avatar && auth.user.avatar.publicUrl)
        ? auth.user.avatar.publicUrl
        : 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png';

    return (
        <div>
            <UserName>
                {
                    auth.user
                        ? auth.user.name
                        : intl.formatMessage({id: 'baselayout.menuheader.GuestUsername'})
                }
            </UserName>
            <Avatar
                size="small"
                src={avatarUrl}
                alt={intl.formatMessage({id: 'Avatar'})}
                className="avatar"
            />
        </div>
    )
}
