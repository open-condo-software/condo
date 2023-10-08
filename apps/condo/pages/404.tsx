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
const Src404 = { poster: '/404Poster.webp', placeholder: '/404PosterPlaceholder.jpg' }

export default function Custom404 (): React.ReactElement {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.error.NotFoundTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.error.NotFoundDescription' })
    const MainPagesMessageButton = intl.formatMessage({ id: 'pages.auth.MainPage' })

    return (
        <Row justify='center'>
            <Col span={24}>
                <Row gutter={ROW_MESSAGE_GUTTER}>
                    <Col span={24}>
                        <Typography.Title>{PageTitle}</Typography.Title>
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

const Error404Layout = (props): React.ReactElement => <PosterLayout
    {...props}
    Header={<ErrorLayoutHeader />}
    Footer={<ErrorLayoutFooter />}
    layoutBgImage={Src404}
/>

Custom404.container = Error404Layout
Custom404.isError = true