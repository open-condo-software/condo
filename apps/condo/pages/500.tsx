import React from 'react'
import { Col, Row, Typography } from 'antd'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { fontSizes } from '@condo/domains/common/constants/style'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'

export const ErrorPosterWrapper = styled.div<{ isSmall: boolean }>`
  height: 55vh;
`

const DESCRIPTION_TEXT_STYLE = { fontSize: fontSizes.content }
const Src500 = { poster: '/500Poster.png', placeholder: '/500PosterPlaceholder.png' }

export default function Custom500 (): React.ReactElement {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.error.PageTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.error.Description' })

    return (
        <Row justify={'space-between'}>
            <Col span={24}>
                <Row gutter={[0, 14]} justify={'center'}>
                    <Col span={18}>
                        <Typography.Title>{PageTitle}</Typography.Title>
                    </Col>
                    <Col span={18}>
                        <Typography.Paragraph style={DESCRIPTION_TEXT_STYLE}>
                            {DescriptionMessage}
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}

export const ErrorLayout = (props): React.ReactElement => <PosterLayout {...props} layoutBgImage={Src500} />

Custom500.container = ErrorLayout