import { Col, Row } from 'antd'
import Router from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Button } from '@open-condo/ui'

import { PageComponentType } from '@condo/domains/common/types'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'


const Src404 = { main: '/404Poster.webp', placeholder: '/404PosterPlaceholder.jpg' }

const Custom404: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.error.NotFoundTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.error.NotFoundDescription' })
    const MainPagesMessageButton = intl.formatMessage({ id: 'pages.auth.MainPage' })

    return (
        <Row justify='start'>
            <ResponsiveCol span={24} desktopWidth={470}>
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Row gutter={[0, 24]}>
                            <Col span={24}>
                                <Typography.Title>{PageTitle}</Typography.Title>
                            </Col>
                            <Col span={24}>
                                <Typography.Paragraph>
                                    {DescriptionMessage}
                                </Typography.Paragraph>
                            </Col>
                        </Row>
                    </Col>
                    <Col>
                        <Button
                            key='submit'
                            type='primary'
                            htmlType='submit'
                            onClick={() => Router.push('/')}
                            data-cy='register-button'
                            block
                        >
                            {MainPagesMessageButton}
                        </Button>
                    </Col>
                </Row>
            </ResponsiveCol>
        </Row>
    )
}

const Error404Layout = (props): React.ReactElement => <PosterLayout
    {...props}
    image={Src404}
/>

Custom404.container = Error404Layout
Custom404.isError = true
Custom404.skipUserPrefetch = true

export default Custom404
