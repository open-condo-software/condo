import React, { useCallback } from 'react'
import Router from 'next/router'
import { FormattedMessage } from 'react-intl'
import { Col, Row } from 'antd'
import { Logo } from '@condo/domains/common/components/Logo'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { formInputFixCss } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import { Global } from '@emotion/core'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import getConfig from 'next/config'
import { Poster } from '@condo/domains/common/components/Poster'
import { Button } from '@condo/domains/common/components/Button'
import { colors } from '@condo/domains/common/constants/style'
import { AuthLayoutContextProvider } from './AuthLayoutContext'
import { ChildrenWrapper, Footer, Header, Layout, PageContent, PosterWrapper } from './styles'

const { publicRuntimeConfig: { googleCaptcha } } = getConfig()

export interface AuthPage extends React.FC {
    headerAction: React.ReactElement
    container: React.FC
}

interface IAuthLayoutProps {
    headerAction: React.ReactElement
}

const AuthLayout: React.FC<IAuthLayoutProps> = ({ children, headerAction }) => {
    const intl = useIntl()
    const { isAuthenticated } = useAuth()

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            Router.push('/')
        } else {
            Router.push('/auth/signin')
        }
    }, [isAuthenticated])

    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={googleCaptcha && googleCaptcha.SITE_KEY}
            language={intl.locale}
            useRecaptchaNet
            scriptProps={{
                async: true,
                defer: true,
                appendTo: 'body',
            }}>
            <AuthLayoutContextProvider>
                <Global styles={formInputFixCss}/>
                <Layout>
                    <Header
                        title={<Logo fillColor={colors.white} onClick={handleLogoClick} />}
                        extra={headerAction}
                    />
                    <Row align={'stretch'}>
                        <Col lg={11} md={24}>
                            <PosterWrapper>
                                <Poster src={'/auth_poster.png'}/>
                            </PosterWrapper>
                        </Col>
                        <Col lg={13} md={24}>
                            <PageContent>
                                <ChildrenWrapper>
                                    <Row>
                                        <Col lg={14} push={4} md={24} pull={6}>
                                            {children}
                                        </Col>
                                    </Row>
                                    <Footer>
                                        <Row>
                                            <Col lg={14} push={4} md={24} pull={6}>
                                                <FormattedMessage
                                                    id='pages.auth.FooterText'
                                                    values={{
                                                        email: <Button size={'small'} type={'inlineLink'} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Button>,
                                                        phone: <Button size={'small'} type={'inlineLink'} href={`tel:${SUPPORT_PHONE}`}>{SUPPORT_PHONE}</Button>,
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                    </Footer>
                                </ChildrenWrapper>
                            </PageContent>
                        </Col>
                    </Row>

                </Layout>
            </AuthLayoutContextProvider>
        </GoogleReCaptchaProvider>
    )
}

export default AuthLayout
