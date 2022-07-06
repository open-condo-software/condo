import React from 'react'
import { Col, Row, RowProps, Typography } from 'antd'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'

import { fontSizes } from '@condo/domains/common/constants/style'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'
import { Button } from '@condo/domains/common/components/Button'
import Router from 'next/router'

export const ErrorPosterWrapper = styled.div<{ isSmall: boolean }>`
  height: 55vh;
`

const DESCRIPTION_TEXT_STYLE = { fontSize: fontSizes.content }
const ROW_MESSAGE_GUTTER: RowProps['gutter'] = [0, 14]
const Src404 = { poster: '/404Poster.png', placeholder: '/404PosterPlaceholder.png' }

export default function Custom404 (): React.ReactElement {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.error.NotFoundTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.error.NotFoundDescription' })
    const MainPagesMessageButton = intl.formatMessage({ id: 'pages.auth.MainPage' })

    return (
        <Row justify={'center'}>
            <Col span={12}>
                <Row gutter={ROW_MESSAGE_GUTTER}>
                    <Col span={18}>
                        <Typography.Title>{PageTitle}</Typography.Title>
                    </Col>
                    <Col span={18}>
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
                            data-cy={'register-button'}
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

export const ErrorLayout = (props): React.ReactElement => <PosterLayout {...props} layoutBgImage={Src404}/>

Custom404.container = ErrorLayout