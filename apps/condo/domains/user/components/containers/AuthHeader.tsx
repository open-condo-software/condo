import { Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useAuth } from '@open-condo/next/auth'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Logo } from '@condo/domains/common/components/Logo'

import { ActionContainer, Header, MobileHeader } from './styles'


const LOGO_HEADER_STYLES = { width: '100%', justifyContent: 'space-between' }
const HEADER_ACTION_STYLES = { alignSelf:'center', marginTop: '10px' }
const HEADER_LOGO_STYLE: React.CSSProperties = { cursor: 'pointer' }

interface IAuthHeaderProps {
    headerAction: React.ReactElement
}

export const AuthHeader: React.FC<IAuthHeaderProps> = ({ headerAction }) => {
    const { breakpoints } = useLayoutContext()
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
        breakpoints.TABLET_LARGE && (
            <Col span={24}>
                <Row>
                    <Header>
                        <Row style={LOGO_HEADER_STYLES}>
                            <Col style={HEADER_LOGO_STYLE}>
                                <Logo onClick={handleLogoClick}/>
                            </Col>
                            <Col style={HEADER_ACTION_STYLES}>
                                {headerAction}
                            </Col>
                        </Row>
                    </Header>
                </Row>
            </Col>
        )
    )
}