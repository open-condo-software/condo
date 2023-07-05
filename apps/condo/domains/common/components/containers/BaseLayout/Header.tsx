import { MenuOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Layout, Space } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Logo } from '@condo/domains/common/components/Logo'
import { ResidentActions } from '@condo/domains/common/components/ResidentActions/ResidentActions'
import { colors, MAX_CONTENT_WIDTH } from '@condo/domains/common/constants/style'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'
import { useOrganizationInvites } from '@condo/domains/organization/hooks/useOrganizationInvites'
import { UserMenu } from '@condo/domains/user/components/UserMenu'

import { ITopMenuItemsProps, TopMenuItems } from './components/TopMenuItems'



const DesktopHeader = styled(Layout.Header)`
  z-index: 9;
  background: ${colors.white};
  width: 100%;
  max-width: ${MAX_CONTENT_WIDTH}px;
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
  width: 100%;
`

interface IHeaderProps {
    headerAction?: React.ElementType
    TopMenuItems?: React.FC<ITopMenuItemsProps>
}

export const Header: React.FC<IHeaderProps> = (props) => {
    const { breakpoints, toggleCollapsed } = useLayoutContext()
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    const { organization } = useOrganization()

    const hasAccessToAppeals = get(organization, 'type', MANAGING_COMPANY_TYPE) !== SERVICE_PROVIDER_TYPE

    useOrganizationInvites()

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            router.push('/')
        } else {
            router.push('/auth/signin')
        }
    }, [isAuthenticated, router])

    return (
        !breakpoints.TABLET_LARGE
            ? (
                <MobileHeader>
                    <Space size={22}>
                        <MenuOutlined onClick={toggleCollapsed}/>
                        {hasAccessToAppeals && (
                            <ResidentActions minified/>
                        )}
                    </Space>
                    <Logo onClick={handleLogoClick} minified/>
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
