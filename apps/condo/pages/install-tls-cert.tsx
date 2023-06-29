import styled from '@emotion/styled'
import { Col, Row, RowProps, Typography } from 'antd'
import Router from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import { fontSizes } from '@condo/domains/common/constants/style'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'

import { ErrorLayoutFooter, ErrorLayoutHeader } from './500'


export const ErrorPosterWrapper = styled.div<{ isSmall: boolean }>`
  height: 55vh;
`

const DESCRIPTION_TEXT_STYLE = { fontSize: fontSizes.content }
const ROW_MESSAGE_GUTTER: RowProps['gutter'] = [0, 14]
const Src404 = { poster: '/404Poster.png', placeholder: '/404PosterPlaceholder.png' }

export default function Custom404 (): React.ReactElement {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'pages.condo.install-tls-cert.title' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.install-tls-cert.description' })
    const MainPagesMessageButton = intl.formatMessage({ id: 'pages.condo.install-tls-cert.button' })


    return (
        <Row justify='center'>
            <Col span={24}>
                <Row gutter={ROW_MESSAGE_GUTTER}>
                    <Col span={24}>
                        <Typography.Title>{TitleMessage}</Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Typography.Paragraph style={DESCRIPTION_TEXT_STYLE}>
                            {DescriptionMessage}
                        </Typography.Paragraph>
                    </Col>
                    <Col>
                        <Button
                            key='submit'
                            type='sberDefaultGradient'
                            htmlType='submit'
                            onClick={() => Router.push('/')}
                            data-cy='register-button'
                            block
                        >
                            {MainPagesMessageButton}
                        </Button>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}

const CustomLayout = (props): React.ReactElement => <PosterLayout
    {...props}
    Header={<ErrorLayoutHeader />}
    Footer={<ErrorLayoutFooter />}
    layoutBgImage={Src404}
/>

Custom404.container = CustomLayout
Custom404.isError = true