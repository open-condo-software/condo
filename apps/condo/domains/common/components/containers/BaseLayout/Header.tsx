import styled from '@emotion/styled'
import { Layout } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { colors } from '@condo/domains/common/constants/style'
import { useResponsive } from '@condo/domains/common/hooks/useResponsive'
import { useAuth } from '@core/next/auth'
import { Logo } from '../../Logo'
import { TopMenuItems } from './components/TopMenuItems'

const DesktopHeader = styled(Layout.Header)`
  z-index: 9;
  background: ${colors.white};
  width: 100%;
  padding: 20px 48px;
  height: auto;
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
}

export const Header: React.FC<IHeaderProps> = (props) => {
    const { isSmall } = useResponsive()
    const router = useRouter()
    const { isAuthenticated } = useAuth()

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
