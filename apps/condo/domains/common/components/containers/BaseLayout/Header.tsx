import styled from '@emotion/styled'
import { Layout } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { colors } from '@condo/domains/common/constants/style'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useAuth } from '@core/next/auth'
import { Logo } from '../../Logo'
import { ITopMenuItemsProps, TopMenuItems as BaseTopMenuItems } from './components/TopMenuItems'

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
  background: ${colors.white};
  justify-content: center;
  border-bottom: 1px solid ${colors.lightGrey[5]};
`

interface IHeaderProps {
    headerAction?: React.ElementType
    TopMenuItems?: React.FC<ITopMenuItemsProps>
}

export const Header: React.FC<IHeaderProps> = (props) => {
    const { isSmall } = useLayoutContext()
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
                    <Logo fillColor={colors.black} onClick={handleLogoClick}/>
                </MobileHeader>
            )
            : (
                <DesktopHeader>
                    <TopMenuItems headerAction={props.headerAction}/>
                </DesktopHeader>
            )
    )
}
