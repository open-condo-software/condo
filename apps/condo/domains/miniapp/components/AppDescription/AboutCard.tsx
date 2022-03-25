import React, { CSSProperties } from 'react'
import styled from '@emotion/styled'
import { Card, Row, Col, Typography, Image } from 'antd'
import { useIntl } from '@core/next/intl'
import { colors } from '@condo/domains/common/constants/style'
import { useWindowSize } from '@condo/domains/common/hooks/useWindowSize'

export type AboutBlockProps = {
    description: string
    title: string,
    imageSrc: string
}

interface AboutCardProps {
    blocks: Array<AboutBlockProps>
}

const SINGLE_CARD_WIDTH_MARK = 780

const CardWrapper = styled.div`
  & > .ant-card {
    overflow: hidden;
    & > .ant-card-body {
      background: ${colors.backgroundLightGrey};
      padding: 40px;
    }
  }
  .about-block-card > .ant-card-body {
    padding: 60px;
    & .ant-image {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
`

const AboutImageWrapper = styled.div`
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  margin-bottom: 36px;
  position: relative;
`

const IMAGE_STYLE: CSSProperties = { objectFit: 'contain', objectPosition: '50% 50%', maxWidth: '100%', maxHeight: '100%' }
const TEXT_BLOCK_STYLE: CSSProperties = { textAlign: 'center' }
const DESCRIPTION_TEXT_STYLE: CSSProperties = { height: 72, lineHeight: '24px', fontSize: 16 }

export const AboutCard: React.FC<AboutCardProps> = ({ blocks }) => {
    const intl = useIntl()
    const AboutServiceMessage = intl.formatMessage({ id: 'services.AboutService' })

    const { width } = useWindowSize()
    const isSingleRow = Boolean(width && width < SINGLE_CARD_WIDTH_MARK)

    return (
        <CardWrapper>
            <Card bordered={false}>
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Typography.Title level={4}>
                            {AboutServiceMessage}
                        </Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Row gutter={[40, 40]}>
                            {
                                blocks.map((block, index) => {
                                    return (
                                        <Col span={isSingleRow ? 24 : 12} key={index}>
                                            <Card bordered={false} className={'about-block-card'}>
                                                <AboutImageWrapper>
                                                    <Image
                                                        src={block.imageSrc}
                                                        style={IMAGE_STYLE}
                                                        preview={false}
                                                        className={'about-block-image'}
                                                    />
                                                </AboutImageWrapper>
                                                <Row gutter={[0, 8]} style={TEXT_BLOCK_STYLE}>
                                                    <Col span={24}>
                                                        <Typography.Title level={5} ellipsis={true}>
                                                            {block.title}
                                                        </Typography.Title>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Typography.Paragraph style={DESCRIPTION_TEXT_STYLE} ellipsis={{ rows:3 }} type={'secondary'}>
                                                            {block.description}
                                                        </Typography.Paragraph>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        </Col>
                                    )
                                })
                            }
                        </Row>
                    </Col>
                </Row>
            </Card>
        </CardWrapper>
    )
}