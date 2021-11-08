import React from 'react'
import { Col, Row, Typography } from 'antd'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'

import { Poster } from '@condo/domains/common/components/Poster'
import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PosterLayout } from '../domains/user/components/containers/PosterLayout'

export const ErrorPosterWrapper = styled.div<{ isSmall: boolean }>`
  height: 55vh;
`

const DESCRIPTION_TEXT_STYLE = { fontSize: fontSizes.content }

export default function Custom500 () {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.error.PageTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.error.Description' })

    const { isSmall } = useLayoutContext()

    const INNER_COLUMN_SPAN = isSmall && 24
    const POSTER_COLUMN_SPAN = isSmall ? 24 : 10

    return (
        <Row justify={'space-between'}>
            <Col span={POSTER_COLUMN_SPAN}>
                {
                    isSmall ? (
                        <ErrorPosterWrapper isSmall={isSmall}>
                            <Poster
                                src={'/authPoster.png'}
                                placeholderSrc={'/authPosterPlaceholder.png'}
                                placeholderColor={colors.selago}
                            />
                        </ErrorPosterWrapper>
                    ) : null
                }
            </Col>
            <Col span={24}>
                <Row gutter={[0, 14]}>
                    <Col span={INNER_COLUMN_SPAN}>
                        <Typography.Title>{PageTitle}</Typography.Title>
                    </Col>
                    <Col span={INNER_COLUMN_SPAN}>
                        <Typography.Paragraph style={DESCRIPTION_TEXT_STYLE}>
                            {DescriptionMessage}
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}

export const ErrorLayout = (props) => <PosterLayout {...props} layoutBgColor={colors.selago} />

Custom500.container = ErrorLayout