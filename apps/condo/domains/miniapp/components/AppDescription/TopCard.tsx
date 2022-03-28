import React, { CSSProperties, useCallback } from 'react'
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
  & > .ant-image {
    width: 100%;
    height: 100%;
    display: flex;
  }
`


const IMAGE_STYLES: CSSProperties = { objectFit: 'contain', maxHeight: '100%', maxWidth: '100%', objectPosition: '50% 50%' }
const WRAP_TEXT_STYLES: CSSProperties = { margin: 0, whiteSpace: 'normal' }

const FALLBACK_IMAGE = '/greyLogo.svg'

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

    const handlePartnerClick = useCallback(() => {
        router.push(partnerUrl)
    }, [router, partnerUrl])

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
                            <Typography.Link onClick={handlePartnerClick}>
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