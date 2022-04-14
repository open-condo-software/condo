import { Image, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { useAuth } from '@core/next/auth'
import { Logo } from '@condo/domains/common/components/Logo'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { colors } from '@condo/domains/common/constants/style'
import { ActionContainer, Header, MobileHeader } from './styles'

const LOGO_HEADER_STYLES = { width: '100%', justifyContent: 'space-between' }
const MINI_POSTER_STYLES = { maxWidth: '15%', marginBottom: '-5px' }
const HEADER_ACTION_STYLES = { alignSelf:'center', marginTop: '10px' }
const HEADER_LOGO_STYLE: React.CSSProperties = { cursor: 'pointer' }

interface IAuthHeaderProps {
    headerAction: React.ReactElement
}

export const AuthHeader: React.FC<IAuthHeaderProps> = ({ headerAction }) => {
    const { isSmall } = useLayoutContext()
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
                <>
                    <MobileHeader>
                        <Row style={LOGO_HEADER_STYLES}>
                            <Col style={HEADER_LOGO_STYLE}>
                                <Logo fillColor={colors.backgroundLightGrey} onClick={handleLogoClick}/>
                            </Col>
                            <Col style={HEADER_ACTION_STYLES}>
                                <ActionContainer>{headerAction}</ActionContainer>
                            </Col>
                        </Row>
                        <Row justify={'center'}>
                            <Col style={MINI_POSTER_STYLES}>
                                <Image src={'/miniPoster.png'}/>
                            </Col>
                        </Row>
                    </MobileHeader>
                </>
            )
            : (
                <Row>
                    <Header>
                        <Row style={LOGO_HEADER_STYLES}>
                            <Col style={HEADER_LOGO_STYLE}>
                                <Logo fillColor={colors.scampi} onClick={handleLogoClick}/>
                            </Col>
                            <Col style={HEADER_ACTION_STYLES}>
                                {headerAction}
                            </Col>
                        </Row>
                    </Header>
                </Row>
            )
    )
}