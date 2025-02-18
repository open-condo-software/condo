import { Col, Row } from 'antd'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageComponentType } from '@condo/domains/common/types'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'

import { ErrorLayoutFooter, ErrorLayoutHeader } from './500'


const Src429 = { poster: '/404Poster.webp', placeholder: '/404PosterPlaceholder.jpg' }

const Custom429: PageComponentType = ({ timestamp }) => {
    const intl = useIntl()

    const date = new Date(timestamp * 1000)

    const PageTitle = intl.formatMessage( { id: 'pages.condo.error.TooManyRequestsTitle' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.error.TooManyRequestsDescription' }, {
        resetTime: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
    })
    const ResetTimeMessage = intl.formatMessage({ id: 'pages.condo.error.TooManyRequestsErrorCode' })

    return (
        <Row justify='space-between'>
            <Col span={24}>
                <Row gutter={[0, 24]} justify='center'>
                    <Col span={24}>
                        <Typography.Title>{PageTitle}</Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Typography.Paragraph>
                            {DescriptionMessage}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                            {ResetTimeMessage}
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}

const Error429Layout = (props): React.ReactElement => <PosterLayout
    {...props}
    Header={<ErrorLayoutHeader />}
    Footer={<ErrorLayoutFooter />}
    layoutBgImage={Src429}
/>

Custom429.container = Error429Layout
Custom429.isError = true
Custom429.skipUserPrefetch = true

export default Custom429
