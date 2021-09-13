import { Col, Row } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { useAuth } from '@core/next/auth'
import { Logo } from '@condo/domains/common/components/Logo'
import { useResponsive } from '@condo/domains/common/hooks/useResponsive'
import { colors } from '@condo/domains/common/constants/style'
import { ActionContainer, Header, MobileHeader } from './styles'

interface IAuthHeaderProps {
    headerAction: React.ReactElement
}

export const AuthHeader: React.FC<IAuthHeaderProps> = ({ headerAction }) => {
    const { isResponsive } = useResponsive()
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
        isResponsive
            ? (
                <>
                    <MobileHeader>
                        <Logo fillColor={colors.scampi} onClick={handleLogoClick}/>
                    </MobileHeader>
                    <Row>
                        <Col span={24}>
                            <ActionContainer>
                                {headerAction}
                            </ActionContainer>
                        </Col>
                    </Row>
                </>
            )
            : (
                <Header
                    title={<Logo fillColor={colors.scampi} onClick={handleLogoClick}/>}
                    extra={headerAction}
                />
            )
    )
}
