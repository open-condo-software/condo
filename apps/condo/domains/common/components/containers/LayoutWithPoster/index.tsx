import { Col, Row } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { Typography } from '@open-condo/ui'
import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import { Logo } from '@condo/domains/common/components/Logo'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { Layout } from '@condo/domains/user/components/containers/styles'

import './styles.css'


const {
    publicRuntimeConfig: { HelpRequisites: { support_email: SUPPORT_EMAIL = null, support_phone: SUPPORT_PHONE = null } },
} = getConfig()
const FORMATTED_SUPPORT_PHONE = SUPPORT_PHONE ? formatPhone(SUPPORT_PHONE) : SUPPORT_PHONE


export type LayoutWithPosterProps = {
    headerAction: React.ReactElement
    Poster: React.FC<PosterProps>
}

export type PosterProps = {
    Header: JSX.Element
    Footer: JSX.Element
}

export const LayoutWithPoster: React.FC<LayoutWithPosterProps> = ({ children, headerAction, Poster }) => {
    const router = useRouter()
    const { isAuthenticated } = useAuth()
    const breakpoints = useBreakpoints()

    const isSmallDisplay = !breakpoints.DESKTOP_SMALL

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            router.push('/')
        } else {
            router.push('/auth')
        }
    }, [isAuthenticated, router?.push])

    const Header = useMemo(() => (
        <Row gutter={[20, 20]} justify='space-between' align='middle'>
            <Col className='layout-with-poster-logo-wrapper'>
                <Logo onClick={handleLogoClick} />
            </Col>
            {
                isSmallDisplay && headerAction && (
                    <Col>
                        {headerAction}
                    </Col>
                )
            }
        </Row>
    ), [handleLogoClick, headerAction, isSmallDisplay])

    const Footer = useMemo(() => (
        <>
            {
                (SUPPORT_EMAIL || SUPPORT_PHONE) && (
                    <>
                        {
                            SUPPORT_EMAIL && (
                                <Typography.Link
                                    href={`mailto:${SUPPORT_EMAIL}`}
                                >
                                    {SUPPORT_EMAIL}
                                </Typography.Link>
                            )
                        }
                        {
                            SUPPORT_PHONE && (
                                <Typography.Link
                                    href={`tel:${SUPPORT_PHONE}`}
                                >
                                    {FORMATTED_SUPPORT_PHONE}
                                </Typography.Link>
                            )
                        }
                    </>
                )
            }
        </>
    ), [])

    return (
        <Layout>
            <Row
                className='layout-with-poster-wrapper'
                gutter={[20, 20]}
            >
                {/* NOTE: 0px so that the width is calculated based on the content */}
                <Col
                    flex={isSmallDisplay ? 'none' : '0px'}
                    span={isSmallDisplay ? 24 : null}
                >
                    <Poster
                        Header={Header}
                        Footer={Footer}
                    />
                </Col>

                <Col
                    className='layout-with-poster-content-col'
                    flex={isSmallDisplay ? 'none' : 'auto'}
                    span={isSmallDisplay ? 24 : null}
                >
                    <Row className='layout-with-poster-content-row'>
                        <Col
                            className='layout-with-poster-content-wrapper'
                            flex='12'
                        >
                            <div className='layout-with-poster-content'>
                                {children}
                            </div>

                            {
                                !isSmallDisplay && headerAction && (
                                    <Row
                                        className='layout-with-poster-content-footer'
                                        align='bottom'
                                    >
                                        <Col>
                                            {headerAction}
                                        </Col>
                                    </Row>
                                )
                            }
                        </Col>
                    </Row>
                </Col>

                {
                    isSmallDisplay && (
                        <Row
                            className='layout-with-poster-content-footer'
                            align='bottom'
                            gutter={[16, 0]}
                        >
                            {Footer}
                        </Row>
                    )
                }
            </Row>
        </Layout>
    )
}
