import styled from '@emotion/styled'
import { Layout, Space } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { colors } from '@condo/domains/common/constants/style'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useAuth } from '@core/next/auth'
import { UserMenu } from '@condo/domains/user/components/UserMenu'
import { ServiceSubscriptionIndicator } from '../../../../subscription/components/ServiceSubscriptionIndicator'
import { Logo } from '../../Logo'
import { ResidentActions } from '../../ResidentActions/ResidentActions'
import { TopMenuItems as BaseTopMenuItems } from './components/TopMenuItems'
import { MenuOutlined } from '@ant-design/icons'

const DesktopHeader = styled(Layout.Header)`
  z-index: 9;
  background: ${colors.white};
  width: 100%;
  padding: 28px 40px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  line-height: 100%;
`

const MobileHeader = styled(Layout.Header)`
  display: flex;
  flex-direction: row;
  background: ${colors.white};
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${colors.lightGrey[5]};
`

const ActionContainer = styled.div``

interface IHeaderProps {
    headerAction?: React.ElementType
    TopMenuItems?: React.FC
}

export const Header: React.FC<IHeaderProps> = (props) => {
    const { isSmall, toggleCollapsed } = useLayoutContext()
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    const TopMenuItems = props.TopMenuItems ? props.TopMenuItems : BaseTopMenuItems

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
                    <Space size={22}>
                        <ServiceSubscriptionIndicator/>
                        <UserMenu/>
                    </Space>
                </MobileHeader>
            )
            : (
                <DesktopHeader>
                    <ActionContainer>
                        {props.headerAction && props.headerAction}
                    </ActionContainer>
                    <TopMenuItems/>
                </DesktopHeader>
            )
    )
}
