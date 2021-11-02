import { Col, Layout, Row, Typography } from 'antd'
import { Poster } from '../domains/common/components/Poster'
import { colors, fontSizes } from '../domains/common/constants/style'
import React from 'react'
import { AuthHeader } from '../domains/user/components/containers/AuthHeader'
import styled from '@emotion/styled'
import { FormattedMessage } from 'react-intl'
import { Button } from '../domains/common/components/Button'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../domains/common/constants/requisites'
import { useIntl } from '@core/next/intl'
import Router from 'next/router'
import { useLayoutContext } from '../domains/common/components/LayoutContext'

export const ErrorPosterWrapper = styled.div<{ isSmall: boolean }>`
  height: ${({ isSmall }) => isSmall ? '55vh' : '100vh'}
`

export const ErrorLayout = ({ children }) => {
    const { isSmall } = useLayoutContext()

    return (
        <Layout style={{ backgroundColor: colors.selago, minHeight: '100vh' }}>
            <AuthHeader headerAction={null}/>
            <Row justify={'space-between'}>
                <Col span={isSmall ? 24 : 10}>
                    <ErrorPosterWrapper isSmall={isSmall}>
                        <Poster
                            src={'/authPoster.png'}
                            placeholderSrc={'/authPosterPlaceholder.png'}
                            placeholderColor={colors.selago}
                        />
                    </ErrorPosterWrapper>
                </Col>
                <Col span={isSmall ? 24 : 12}>
                    {children}
                </Col>
            </Row>
        </Layout>
    )
}

export interface AuthPage extends React.FC {
    container: React.FC
}

const ServerErrorWrapper = styled(Row)<{ isSmall: boolean }>`
  height: ${({ isSmall }) => !isSmall && '100vh' };
  align-items: ${({ isSmall }) => isSmall ? 'center' : 'flex-end'};
  padding-left: 20px;
`

export default function Custom500 () {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.error.PageTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.error.Description' })

    const { isSmall } = useLayoutContext()

    return (
        <ServerErrorWrapper isSmall={isSmall}>
            <Col span={isSmall ? 22 : 15} style={{ height: isSmall ? '30vh' : '55vh' }}>
                <Row justify={'center'} gutter={[0, 20]} style={{ height: '100%' }}>
                    <Col span={24}>
                        <Row gutter={[0, 14]}>
                            <Col span={isSmall && 24}>
                                <Typography.Title>{PageTitle}</Typography.Title>
                            </Col>
                            <Col span={isSmall && 24}>
                                <Typography.Paragraph style={{ fontSize: fontSizes.content }}>
                                    {DescriptionMessage}
                                </Typography.Paragraph>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Typography.Paragraph type={'secondary'} style={{ fontSize: '12px' }}>
                            <FormattedMessage
                                id='FooterText'
                                values={{
                                    email: <Button size={'small'} type={'inlineLink'} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Button>,
                                    phone: <Button size={'small'} type={'inlineLink'} href={`tel:${SUPPORT_PHONE}`}>{SUPPORT_PHONE}</Button>,
                                }}
                            />
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </Col>
        </ServerErrorWrapper>
    )
}

Custom500.container = ErrorLayout