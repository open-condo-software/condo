import React  from 'react'
import { FormattedMessage } from 'react-intl'
import { Col, Row } from 'antd'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { formInputFixCss } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import { Global } from '@emotion/core'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { useIntl } from '@core/next/intl'
import getConfig from 'next/config'
import { Poster } from '@condo/domains/common/components/Poster'
import { Button } from '@condo/domains/common/components/Button'
import { colors } from '@condo/domains/common/constants/style'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { AuthHeader } from './AuthHeader'
import { AuthLayoutContextProvider } from './AuthLayoutContext'
import { ChildrenWrapper, Footer, Layout, PageContent, PosterWrapper } from './styles'

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
    const { isSmall } = useLayoutContext()

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
            <Global styles={formInputFixCss}/>
            <Layout>
                <AuthHeader headerAction={headerAction}/>
                <Row align={'stretch'}>
                    <Col lg={11} md={24} hidden={isSmall}>
                        <PosterWrapper>
                            <Poster
                                src={'/authPoster.png'}
                                placeholderSrc={'/authPosterPlaceholder.png'}
                                placeholderColor={colors.selago}
                            />
                        </PosterWrapper>
                    </Col>
                    <Col lg={13} md={24}>
                        <PageContent isSmall={isSmall}>
                            <ChildrenWrapper isSmall={isSmall}>
                                <Row>
                                    <Col lg={14} md={24} push={isSmall ? 0 : 4} pull={isSmall ? 0 : 6}>
                                        <AuthLayoutContextProvider>
                                            {children}
                                        </AuthLayoutContextProvider>
                                    </Col>
                                </Row>
                                <Footer isSmall={isSmall}>
                                    <Row>
                                        <Col lg={14} md={24} push={isSmall ? 0 : 4} pull={isSmall ? 0 : 6}>
                                            <FormattedMessage
                                                id='FooterText'
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
        </GoogleReCaptchaProvider>
    )
}

export default AuthLayout
