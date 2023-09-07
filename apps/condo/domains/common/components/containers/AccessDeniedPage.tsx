import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import Head from 'next/head'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { fontSizes } from '@condo/domains/common/constants/style'

import { PageContent, PageHeader, PageWrapper } from './BaseLayout'

import { Poster } from '../Poster'

export const AccessDeniedPosterWrapper = styled.div`
  height: 160px;
  width: 160px;
  
  div {
    background-size: 160px 160px;
  }
`

const MAIN_ROW_STYLES: CSSProperties = { height: '100%' }
const CONTACT_WITH_ADMIN_PARAGRAPH_STYLES: CSSProperties = { textAlign: 'center', fontSize: fontSizes.large, marginBottom: '8px' }
const NO_PERMISSION_PARAGRAPH_STYLES: CSSProperties = { textAlign: 'center', fontSize: fontSizes.content }

interface IAccessDeniedPageProps {
    title?: string
}

export const AccessDeniedPage: React.FC<IAccessDeniedPageProps> = ({ title }) => {
    const intl = useIntl()
    const ContactTheAdministratorMessage = intl.formatMessage({ id: 'ContactTheAdministrator' })
    const NoPermissionMessage = intl.formatMessage({ id: 'global.noPageViewPermission' })
    const ErrorOccurredMessage = intl.formatMessage({ id: 'ErrorOccurred' })

    return (
        <>
            <Head>
                <title>{title || ErrorOccurredMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={title}/>
                <PageContent>
                    <Row align='middle' justify='center' style={MAIN_ROW_STYLES}>
                        <Col>
                            <Row justify='center' gutter={[0, 20]}>
                                <Col>
                                    <AccessDeniedPosterWrapper>
                                        <Poster
                                            src='/404Poster.png'
                                            placeholderSrc='/404PosterPlaceholder.jpg'
                                            delay={0}
                                        />
                                    </AccessDeniedPosterWrapper>
                                </Col>
                                <Col span={24}>
                                    <Typography.Paragraph style={CONTACT_WITH_ADMIN_PARAGRAPH_STYLES} strong>
                                        {ContactTheAdministratorMessage}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph style={NO_PERMISSION_PARAGRAPH_STYLES} type='secondary'>
                                        {NoPermissionMessage}
                                    </Typography.Paragraph>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}
