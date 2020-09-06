/** @jsx jsx */
import { jsx } from '@emotion/core'
import {useIntl} from "react-intl";
import { Avatar } from 'antd'

export const CustomAvatar = ({auth, styles}) => {
    const intl = useIntl();
    const avatarUrl = (auth.user && auth.user.avatar && auth.user.avatar.publicUrl)
        ? auth.user.avatar.publicUrl
        : 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png';

    return (
        <div css={styles}>
            <Avatar
                size="small"
                src={avatarUrl}
                alt={intl.formatMessage({id: 'Avatar'})}
                className="avatar"
            />
            <span className="name">
                {
                    auth.user
                        ? auth.user.name
                        : intl.formatMessage({id: 'baselayout.menuheader.GuestUsername'})
                }
            </span>
        </div>
    )
}
