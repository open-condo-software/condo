import React, { CSSProperties } from 'react'
import { Image, Card, Typography, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import styled from '@emotion/styled'
import { colors, shadows, transitions } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'
import { useIntl } from '@core/next/intl'
import { TagContainer } from '../TagContainer'
interface AppSelectCardProps {
    logoSrc?: string
    tag?: string
    title: string,
    description: string,
    disabled?: boolean
    url: string,
}

const FALLBACK_IMAGE = '/greyLogo.svg'

interface CardWrapperProps {
    disabled?: boolean
}

// NOTE: Wrapper to fix inner css, since we cannot access title container from headStyle
const CardWrapper = styled.div<CardWrapperProps>`
  position: relative;
  ${(props) => props.disabled ? '' : 'cursor: pointer;'}
  & > .ant-card {
    box-sizing: border-box;
    border: 1px solid ${colors.backgroundWhiteSecondary};
    transition: ${transitions.elevateTransition};
    ${(props) => props.disabled ? 'opacity: 0.5;' : `
    &:hover {
      border-color: ${colors.white};
      box-shadow: ${shadows.small};
    }`}
    & > .ant-card-head {
      width: 100%;
      height: 100%;
      padding: 30px;
      & > .ant-card-head-wrapper {
        & > .ant-card-head-title {
          position: relative;
          width: 100%;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          & > .ant-image {
            height: 36px;
          }
        }
      }
    }
  }
`

const IMAGE_STYLES: CSSProperties = { objectFit: 'contain', height: '100%' }
const BUTTON_STYLES: CSSProperties = { marginTop: 12 }
const PARAGRAPH_STYLE: CSSProperties = { margin: 0, height: 66 }

export const AppSelectCard: React.FC<AppSelectCardProps> = ({ logoSrc, tag, disabled, url, title, description }) => {
    const intl = useIntl()
    const MoreMessage = intl.formatMessage({ id: 'services.More' })

    const router = useRouter()

    const clickHandler = () => {
        if (disabled) return
        router.push(url)
    }

    return (
        <CardWrapper disabled={disabled}>
            <Card
                title={<Image src={logoSrc || FALLBACK_IMAGE} style={IMAGE_STYLES} preview={false} fallback={FALLBACK_IMAGE}/>}
                bordered={false}
                onClick={clickHandler}
            >
                <Row gutter={[0, 12]}>
                    <Col span={24}>
                        <Typography.Title level={5} ellipsis={true}>
                            {title}
                        </Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Typography.Paragraph style={PARAGRAPH_STYLE} ellipsis={{ rows: 3 }}>
                            <Typography.Text type={'secondary'}>
                                {description}
                            </Typography.Text>
                        </Typography.Paragraph>
                    </Col>
                    <Col span={24}>
                        <Button
                            style={BUTTON_STYLES}
                            type={'sberBlack'}
                            disabled={disabled}
                        >
                            {MoreMessage}
                        </Button>
                    </Col>
                </Row>
            </Card>
            {
                tag && (
                    <TagContainer right={4} top={4}>
                        <Typography.Text type={'secondary'}>
                            {tag}
                        </Typography.Text>
                    </TagContainer>
                )
            }
        </CardWrapper>
    )
}