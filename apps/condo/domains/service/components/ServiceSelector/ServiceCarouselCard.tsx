import React, { CSSProperties } from 'react'
import { Image, Card, Row, Col, Typography, Space } from 'antd'
import styled from '@emotion/styled'
import { CheckIcon } from '@condo/domains/common/components/icons/Check'
import { useIntl } from '@core/next/intl'
import { gradients } from '@condo/domains/common/constants/style'
import { useRouter } from 'next/router'

interface ServiceCarouselCardProps {
    logoSrc?: string
    title: string
    url: string
}

const FALLBACK_LOGO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wCEAAQEBAQEBAUFBQUHBwYHBwoJCAgJCg8KCwoLCg8WDhAODhAOFhQYExITGBQjHBgYHCMpIiAiKTEsLDE+Oz5RUW0BBAQEBAQEBQUFBQcHBgcHCgkICAkKDwoLCgsKDxYOEA4OEA4WFBgTEhMYFCMcGBgcIykiICIpMSwsMT47PlFRbf/CABEIADAAMAMBIgACEQEDEQH/xAAyAAEBAAIDAQAAAAAAAAAAAAAFBgADAQIECAEAAwEBAQAAAAAAAAAAAAAAAQIDAAQF/9oADAMBAAIQAxAAAAD7sg+NHoSzFSnFk/4JzkcG2BQsPdtg6BcF0oZ6wodtUdzNCsNZQEjIVm3/xAA0EAACAQMBBQMJCQAAAAAAAAABAgMABAURBhATIVESFDEWIjVBQlRhgZJTYnFzgoOistH/2gAIAQEAAT8AzWaFgODBoZyPkoqe7ubpi00ruT1O/FYO9EKXHfHgZhqqqNeR61Z3sneGsrrTvCjtBhyWReoq6na5uJZmOpdidyYXIva95WE9jp7RHUDdj9oLA2kazycORFAYEHnp00q/y4ny0V1DqEi0C6+sA86VWdgqgkk6ACsXgYrRO935XVRqEPgnxNPtTEt2FWLW2HIt7X4isjh7bKxC7sWUOw9XJX/w1JHJC7RyKVdToQd2z4By9t+v+prai4m72lv2zwhGG7I8NTu2buZo8jHCrnhydrtL6jopNbT+kz+Wu7EwNbbQxwsNCjSD+JraaKR8kCqMRwl8B8TXAn+yf6TWAilXLWxaNgPP5kfdNbT+k/2lq1ga5uYoVHN2Aq8x5N3FfQKDPH4qToHBGmnwNT7RvbMVmx8qEdTXlbD7q31V5Ww+6t9VXkl1m70yw2zcwFAHPkOprC4UWA40+hnI+Siv/8QAHhEBAQACAgIDAAAAAAAAAAAAAQIAAxESMVETMpH/2gAIAQIBAT8A16yA94UPhzreyqKM2NVZA8cnK5WvodoeEP3Je0jhdVc1Jy9eEyq2onx+T3jZr1g/bjxn/8QAGREBAQEAAwAAAAAAAAAAAAAAEQEAECFR/9oACAEDAQE/ALXhk0By9XXBDE9w3f/Z'

// NOTE: Wrapper to fix inner css
const CardWrapper = styled.div`
  cursor: pointer;
  & .ant-card-body {
    padding: 24px;
  }
`

const LogoContainer = styled.div`
  width: 100%;
  height: 24px;
`

const ConnectContainer = styled.span`
  background: ${gradients.mainGradientPressed};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const IMAGE_STYLES: CSSProperties = {
    objectFit: 'contain',
}

const TEXT_BLOCK_STYLE: CSSProperties = {
    height: 48,
    margin: 0,
}

const TEXT_STYLE: CSSProperties = {
    lineHeight: '24px',
}

export const ServiceCarouselCard: React.FC<ServiceCarouselCardProps> = ({ logoSrc, title, url }) => {
    const intl = useIntl()
    const ConnectedLabel = intl.formatMessage({ id: 'Connected' })
    const router = useRouter()

    return (
        <CardWrapper>
            <Card
                bordered={false}
                onClick={() => router.push(url)}
            >
                <Row gutter={[0, 12]}>
                    <Col span={24}>
                        <LogoContainer>
                            <Image src={logoSrc || FALLBACK_LOGO} height={24} style={IMAGE_STYLES} preview={false} fallback={FALLBACK_LOGO}/>
                        </LogoContainer>
                    </Col>
                    <Col span={24}>
                        <Typography.Paragraph style={TEXT_BLOCK_STYLE} ellipsis={{ rows: 2 }}>
                            <Typography.Title level={5} style={TEXT_STYLE}>
                                {title}
                            </Typography.Title>
                        </Typography.Paragraph>
                    </Col>
                    <Col span={24}>
                        <Space size={10} direction={'horizontal'}>
                            <CheckIcon fill={'#222'}/>
                            <ConnectContainer>
                                {ConnectedLabel}
                            </ConnectContainer>
                        </Space>
                    </Col>
                </Row>
            </Card>
        </CardWrapper>
    )
}