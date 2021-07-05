// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { Space } from 'antd'
import { MenuUnfoldOutlined, BellFilled } from '@ant-design/icons'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { OrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { useOrganizationInvites } from '@condo/domains/organization/hooks/useOrganizationInvites'
import { TopMenuItem, menuIconStyles } from './styles'
import { UserMenu } from '@condo/domains/user/components/UserMenu'
import { Loader } from '@condo/domains/common/components/Loader'

interface ITopMenuItemsProps {
    isMobile: boolean
    isSideMenuCollapsed: boolean
    headerAction?: React.ElementType
    toggleSideMenuCollapsed: () => void
}

export const TopMenuItems: React.FC<ITopMenuItemsProps> = (props) => {
    const auth = useAuth()
    const { isLoading } = useOrganization()
    const { loading: isInvitesLoading } = useOrganizationInvites()
    const { isMobile, toggleSideMenuCollapsed } = props
    if (isLoading || auth.isLoading || isInvitesLoading) {
        return (
            <Loader fill='false' />
        )
    }
    return (
        <>
            {props.headerAction && props.headerAction}
            {
                isMobile && (
                    <TopMenuItem onClick={toggleSideMenuCollapsed}>
                        <MenuUnfoldOutlined style={menuIconStyles}/>
                    </TopMenuItem>
                )
            }
            <Space direction={'horizontal'} size={40} style={{ marginLeft: 'auto' }}>
                <BellFilled style={{ ...menuIconStyles, marginLeft: 'auto' }}/>
                <OrganizationSelect/>
                <UserMenu/>
            </Space>
        </>
    )
}
