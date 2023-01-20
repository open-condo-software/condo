import { MenuOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Layout, Space } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useAuth } from '@open-condo/next/auth'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { colors } from '@condo/domains/common/constants/style'
import { useOrganizationInvites } from '@condo/domains/organization/hooks/useOrganizationInvites'
import { UserMenu } from '@condo/domains/user/components/UserMenu'

import { ITopMenuItemsProps, TopMenuItems } from './components/TopMenuItems'

import { Logo } from '../../Logo'
import { ResidentActions } from '../../ResidentActions/ResidentActions'

const DesktopHeader = styled(Layout.Header)`
  z-index: 9;
  background: ${colors.white};
  width: 100%;
  padding: 20px 48px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  line-height: 100%;
`

const MobileHeader = styled(Layout.Header)`
  display: flex;
  flex-direction: row;
  padding: 12px 22px;
  background: ${colors.white};
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${colors.lightGrey[5]};
`

interface IHeaderProps {
    headerAction?: React.ElementType
    TopMenuItems?: React.FC<ITopMenuItemsProps>
}

export const Header: React.FC<IHeaderProps> = (props) => {
    const { isSmall, toggleCollapsed } = useLayoutContext()
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    useOrganizationInvites()

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            router.push('/')
        } else {
            router.push('/auth/signin')
        }
    }, [isAuthenticated, router])

    return (
        isSmall
            ? (
                <MobileHeader>
                    <Space size={22}>
                        <MenuOutlined onClick={toggleCollapsed}/>
                        <ResidentActions minified/>
                    </Space>
                    <Logo fillColor={colors.logoPurple} onClick={handleLogoClick} minified/>
                    <UserMenu/>
                </MobileHeader>
            )
            : (
                <DesktopHeader>
                    <TopMenuItems headerAction={props.headerAction}/>
                </DesktopHeader>
            )
    )
}
