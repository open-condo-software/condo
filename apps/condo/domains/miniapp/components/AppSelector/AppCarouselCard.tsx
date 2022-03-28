import React, { CSSProperties } from 'react'
import { Image, Card, Row, Col, Typography, Space } from 'antd'
import styled from '@emotion/styled'
import { CheckIcon } from '@condo/domains/common/components/icons/Check'
import { useIntl } from '@core/next/intl'
import { gradients } from '@condo/domains/common/constants/style'
import { useRouter } from 'next/router'
import { colors, shadows, transitions } from '@condo/domains/common/constants/style'

interface AppCarouselCardProps {
    logoSrc?: string
    title: string
    url: string
}

const FALLBACK_LOGO = '/greyLogo.svg'

// NOTE: Wrapper to fix inner css
const CardWrapper = styled.div`
  cursor: pointer;
  border: 1px solid ${colors.backgroundWhiteSecondary};
  transition: ${transitions.elevateTransition};
  box-sizing: border-box;
  border-radius: 12px;
  &:hover {
    border-color: ${colors.white};
    box-shadow: ${shadows.small};
  }
  & > .ant-card {
    & > .ant-card-body {
      padding: 24px;
    }
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
    objectPosition: 'left',
}

const TEXT_BLOCK_STYLE: CSSProperties = {
    height: 48,
    margin: 0,
}

const TEXT_STYLE: CSSProperties = {
    lineHeight: '24px',
}

export const AppCarouselCard: React.FC<AppCarouselCardProps> = ({ logoSrc, title, url }) => {
    const intl = useIntl()
    const ConnectedLabel = intl.formatMessage({ id: 'Connected' })
    const router = useRouter()

    return (
        <CardWrapper>
            <Card
                onClick={() => router.push(url)}
                bordered={false}
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