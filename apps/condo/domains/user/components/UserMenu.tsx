import { Dropdown } from 'antd'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import { useRouter } from 'next/router'
import qs from 'qs'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { MoreVertical } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'
import type { TypographyTextProps } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'

import type { DropdownProps } from 'antd'


const SIGN_OUT_BROADCAST_CHANNEL = 'signOut'

function formatUserName (name) {
    const splittedName = name.split(' ')
    return splittedName[0]
}

const DROPDOWN_OVERLAY_STYLES: CSSProperties = { maxWidth: 180, width: '100%' }

type UserMenuProps = {
    goToAfterLogout?: () => unknown | Promise<unknown>
}
export const UserMenu: React.FC<UserMenuProps> = ({
    goToAfterLogout,
}) => {
    const { breakpoints } = useLayoutContext()

    const intl = useIntl()
    const MyProfileMessage = intl.formatMessage({ id: 'profile' })
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const auth = useAuth()
    const router = useRouter()
    const userName = formatUserName(get(auth, ['user', 'name'], ''))

    const handleProfileClick = useCallback(() => {
        router.push('/user')
    }, [router])

    const { 
        sendMessageToBroadcastChannel: sendSignOutToBroadcast,
    } = useBroadcastChannel(
        SIGN_OUT_BROADCAST_CHANNEL,
        async () => {
            await router.push('/auth/signin?' + qs.stringify({ next: router.asPath }))
        }
    )

    const handleSignOutClick = useCallback(async () => {
        sendSignOutToBroadcast()

        await auth.signOut()
        if (isFunction(goToAfterLogout)) {
            await goToAfterLogout()
        }
    }, [auth, sendSignOutToBroadcast, goToAfterLogout])

    const menu = useMemo<DropdownProps['menu']>(() => {
        return {
            items: [
                {
                    key: 'profile',
                    label: (
                        <Typography.Text size='medium' type='inherit'>{MyProfileMessage}</Typography.Text>
                    ),
                    onClick: handleProfileClick,
                },
                {
                    key: 'signOut',
                    label: (
                        <Typography.Text size='medium' type='inherit'>{SignOutMessage}</Typography.Text>
                    ),
                    onClick: handleSignOutClick,
                },
            ],
        }
    }, [MyProfileMessage, SignOutMessage, handleProfileClick, handleSignOutClick])

    const textSize: TypographyTextProps['size'] = !breakpoints.TABLET_LARGE ? 'small' : 'medium'

    return (
        <Dropdown placement='bottomRight' menu={menu} overlayClassName='user-dropdown-overlay' overlayStyle={DROPDOWN_OVERLAY_STYLES}>
            <Space size={8} direction='horizontal' className='user-dropdown'>
                <Typography.Text size={textSize} onClick={handleProfileClick}>
                    {userName}
                </Typography.Text>
                <div className='expand-icon-wrapper'>
                    <MoreVertical size='small'/>
                </div>
            </Space>
        </Dropdown>
    )
}
