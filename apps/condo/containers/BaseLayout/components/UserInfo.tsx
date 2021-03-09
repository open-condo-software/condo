// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Avatar, Dropdown, Tag, Typography, Space } from 'antd'
import { gold } from '@ant-design/colors'
import { EnvironmentFilled, GitlabFilled, RestFilled } from '@ant-design/icons'
import { TopMenuItem, UserInfoContainer, UserInfoWrapper, StyledMenu, StyledMenuItem, menuIconStyles } from './styles'
import React from 'react'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import { colors } from '../../../constants/style'
import { Button } from '../../../components/Button'

function goToSignin () {
    Router.push('/auth/signin')
}

function goToOrganization () {
    Router.push('/organizations')
}

export const UserInfo = () => {
    const auth = useAuth()
    const intl = useIntl()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { organization, link } = useOrganization()

    const SignInMessage = intl.formatMessage({ id: 'SignIn' })
    const AvatarMessage = intl.formatMessage({ id: 'Avatar' })
    const GuestUsernameMessage = intl.formatMessage({ id: 'baselayout.menuheader.GuestUsername' })
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const OwnerMessage = intl.formatMessage({ id: 'Owner' })
    const avatarUrl = get(auth, ['user', 'avatar', 'publicUrl'])

    const DropdownOverlay = (
        <StyledMenu>
            {organization && (
                <StyledMenuItem onClick={goToOrganization}>
                    <Space size={16}>
                        <EnvironmentFilled style={menuIconStyles}/>
                        <>
                            {organization.name + ' '}
                            {get(link, 'role') === 'owner' && <Tag color="error" className="tag">{OwnerMessage}</Tag>}
                        </>
                    </Space>
                </StyledMenuItem>
            )}
            <StyledMenuItem key="signout" onClick={auth.signout}>
                <Space size={16}>
                    <RestFilled style={menuIconStyles}/>
                    {SignOutMessage}
                </Space>
            </StyledMenuItem>
        </StyledMenu>
    )

    return (
        <UserInfoWrapper>
            {
                auth.isAuthenticated
                    ? (
                        <Dropdown overlay={DropdownOverlay} placement='bottomCenter'>
                            <UserInfoContainer>
                                <Space size={1}>
                                    <Avatar
                                        size='small'
                                        style={{ backgroundColor: gold[4], borderRadius: '8px' }}
                                        src={avatarUrl}
                                        icon={<GitlabFilled style={{ color: colors.white }}/>}
                                        alt={AvatarMessage}
                                        className='avatar'
                                    />
                                    <Button type='link'>
                                        <Typography.Text ellipsis style={{ color: colors.sberPrimary[6], maxWidth: '34px', fontSize: '12px' }}>
                                            Константин Константипноаольс
                                            {auth.user ? auth.user.name : GuestUsernameMessage}
                                        </Typography.Text>
                                    </Button>
                                </Space>
                            </UserInfoContainer>
                        </Dropdown>
                    )
                    : <TopMenuItem onClick={goToSignin}>
                        <span className='link'>{SignInMessage}</span>
                    </TopMenuItem>
            }
        </UserInfoWrapper>
    )
}