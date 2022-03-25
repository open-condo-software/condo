import React, { CSSProperties } from 'react'
import { Card, Image, Space, Typography, Row, Col } from 'antd'
import styled from '@emotion/styled'
import dayjs from 'dayjs'
import { colors } from '@condo/domains/common/constants/style'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { useWindowSize } from '@condo/domains/common/hooks/useWindowSize'
import { TagContainer } from '../TagContainer'

interface TopCardTitleProps {
    logoSrc?: string,
    title: string,
    description: string,
    partnerUrl?: string,
    tag?: string,
}

interface TopCardProps extends TopCardTitleProps {
    developer: string,
    published: string,
}

interface CenteredProps {
    centered: boolean
}

const CardWrapper = styled.div<CenteredProps>`
  border-radius: 12px;
  position: relative;
  & > .ant-card {
    overflow: hidden;
    & > .ant-card-body {
      background: ${colors.backgroundLightGrey};
      padding: 26px 40px;
    }
    & > .ant-card-head {
      padding: 0;
      & .ant-card-head-title {
        padding: 40px 40px ${(props) => props.centered ? 40 : 48}px 40px;
        position: relative;
        // logo + vert.paddings
        min-height: ${(props) => props.centered ? 240 : 248}px;
      }
    }
  }
  
  & .ant-space {
    max-width: 100%;
    & > .ant-space-item {
      max-width: 100%;
      & > .ant-typography-ellipsis-single-line {
        max-width: 100%;
      }
    }
  }
`

const LogoContainer = styled.div<CenteredProps>`
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 12px;
  top: 40px;
  left: ${(props) => props.centered ? 'calc(50% - 80px)' : '40px'};
  padding: 20px;
  box-sizing: border-box;
  border: 1px solid ${colors.backgroundWhiteSecondary};
`


const IMAGE_STYLES: CSSProperties = { objectFit: 'contain' }
const WRAP_TEXT_STYLES: CSSProperties = { margin: 0, whiteSpace: 'normal' }

const FALLBACK_IMAGE = 'data:image/png;base64,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'

const TITLE_VERTICAL_MARK = 720

const TopCardTitle: React.FC<TopCardTitleProps> = ({ logoSrc, title, description }) => {
    const { width } = useWindowSize()
    const isSmallLayout = Boolean(width && width < TITLE_VERTICAL_MARK)

    const rowMargins: CSSProperties = isSmallLayout ? { marginTop: 180 } : { marginLeft: 200, marginTop: 12 }

    return (
        <>
            <LogoContainer centered={isSmallLayout}>
                <Image src={logoSrc || FALLBACK_IMAGE} style={IMAGE_STYLES} preview={false} fallback={FALLBACK_IMAGE}/>
            </LogoContainer>
            <Row gutter={[0, 16]} style={rowMargins}>
                <Col span={24}>
                    <Typography.Title level={4} style={WRAP_TEXT_STYLES}>
                        {title}
                    </Typography.Title>
                </Col>
                <Col span={24}>
                    <Typography.Paragraph style={WRAP_TEXT_STYLES} type={'secondary'}>
                        {description}
                    </Typography.Paragraph>
                </Col>
            </Row>
        </>
    )
}



export const TopCard: React.FC<TopCardProps> = ({
    developer,
    published,
    title,
    description,
    partnerUrl,
    tag,
    logoSrc,
}) => {
    const intl = useIntl()
    const DeveloperMessage = intl.formatMessage({ id: 'Developer' })
    const PublishedMessage = intl.formatMessage({ id: 'Published' })
    const PartnerSiteMessage = intl.formatMessage({ id: 'services.PartnerSite' })

    const { width } = useWindowSize()
    const isSmallLayout = Boolean(width && width < TITLE_VERTICAL_MARK)

    const router = useRouter()

    return (
        <CardWrapper centered={isSmallLayout}>
            <Card bordered={true} title={<TopCardTitle title={title} description={description} partnerUrl={partnerUrl} tag={tag} logoSrc={logoSrc}/>}>
                <Space size={[40, 0]} direction={'horizontal'} wrap={true}>
                    <Typography.Text ellipsis={true}>
                        <Typography.Text type={'secondary'}>
                            {DeveloperMessage}:&nbsp;
                        </Typography.Text>
                        <Typography.Text strong>
                            {developer}
                        </Typography.Text>
                    </Typography.Text>
                    <Typography.Text ellipsis={true}>
                        <Typography.Text type={'secondary'}>
                            {PublishedMessage}:&nbsp;
                        </Typography.Text>
                        <Typography.Text strong>
                            {dayjs(published).format('DD.MM.YYYY')}
                        </Typography.Text>
                    </Typography.Text>
                    {
                        partnerUrl && (
                            <Typography.Link onClick={() => router.push(partnerUrl)}>
                                {PartnerSiteMessage}
                            </Typography.Link>
                        )
                    }
                </Space>
            </Card>
            {
                tag && (
                    <TagContainer right={40} top={isSmallLayout ? 40 : 56}>
                        <Typography.Text type={'secondary'}>
                            {tag}
                        </Typography.Text>
                    </TagContainer>
                )
            }
        </CardWrapper>
    )
}