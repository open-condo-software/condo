import React from 'react'
import { Col, Layout, Row, Typography } from 'antd'
import styled from '@emotion/styled'
import { FormattedMessage } from 'react-intl'
import { useIntl } from '@core/next/intl'
import { Gutter } from 'antd/es/grid/row'

import { Poster } from '@condo/domains/common/components/Poster'
import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { AuthHeader } from '@condo/domains/user/components/containers/AuthHeader'
import { Button } from '@condo/domains/common/components/Button'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'


export const ErrorPosterWrapper = styled.div<{ isSmall: boolean }>`
  height: ${({ isSmall }) => isSmall ? '55vh' : '100vh'}
`

const ERROR_LAYOUT_STYLE = { backgroundColor: colors.selago, minHeight: '100vh' }

export const ErrorLayout = ({ children }) => {
    const { isSmall } = useLayoutContext()

    const POSTER_COLUMN_SPAN = isSmall ? 24 : 10
    const DESCRIPTION_COLUMN_SPAN = isSmall ? 24 : 12

    return (
        <Layout style={ERROR_LAYOUT_STYLE}>
            <AuthHeader headerAction={null}/>
            <Row justify={'space-between'}>
                <Col span={POSTER_COLUMN_SPAN}>
                    <ErrorPosterWrapper isSmall={isSmall}>
                        <Poster
                            src={'/authPoster.png'}
                            placeholderSrc={'/authPosterPlaceholder.png'}
                            placeholderColor={colors.selago}
                        />
                    </ErrorPosterWrapper>
                </Col>
                <Col span={DESCRIPTION_COLUMN_SPAN}>
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

const MOBILE_DESCRIPTION_COLUMN_STYLE = { height: '30vh' }
const DESKTOP_DESCRIPTION_COLUMN_STYLE = { height: '55vh' }

const DESCRIPTION_ROW_STYLE = { height: '100%' }
const DESCRIPTION_ROW_GUTTER: [Gutter, Gutter] = [0, 20]

const DESCRIPTION_TEXT_STYLE = { fontSize: fontSizes.content }
const FOOTER_TEXT_STYLE = { fontSize: '12px' }

export default function Custom500 () {
    const intl = useIntl()
    const PageTitle = intl.formatMessage( { id: 'pages.condo.error.PageTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.error.Description' })

    const { isSmall } = useLayoutContext()

    const COLUMN_SPAN = isSmall ? 22 : 15
    const COLUMN_STYLE = isSmall ? MOBILE_DESCRIPTION_COLUMN_STYLE : DESKTOP_DESCRIPTION_COLUMN_STYLE
    const INNER_COLUMN_SPAN = isSmall && 24

    return (
        <ServerErrorWrapper isSmall={isSmall}>
            <Col span={COLUMN_SPAN} style={COLUMN_STYLE}>
                <Row justify={'center'} gutter={DESCRIPTION_ROW_GUTTER} style={DESCRIPTION_ROW_STYLE}>
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
                    <Col span={24}>
                        <Typography.Paragraph type={'secondary'} style={FOOTER_TEXT_STYLE}>
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