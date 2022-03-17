import React, { CSSProperties } from 'react'
import { Image, Card, Typography, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import styled from '@emotion/styled'
import { colors, shadows, transitions } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'
import { useIntl } from '@core/next/intl'

interface AppSelectCardProps {
    logoSrc?: string
    tag?: string
    title: string,
    description: string,
    disabled?: boolean
    url: string,
}

const FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAS9QTFRFAAAAzs7nzNbgztji0NDj0dHk09PlzNXmz8/n0tLn0NPk0dTl0dXlz9Lm0dPkz9Tlz9Tl0NLl0NPl0dPm0dPm0NPl0NPk0NTkz9Pl0NPl0NPl0NPk0dTm0dPmz9Tk0NLl0NPl0NPl0NPl0NTl0NPl0NPl0NPl0NPl1Nfn0NPl0NPl0NPl0NPl0tXm2Nvq0NPl0dTl0dTm0tXm09Xm09bn1Nbn1Nfn1dfo1djo1tjo1tno19np2Nvp2Nvq2dvq2tzq293r297r3N7s3d/s3uDt3+Ht3+Hu4OLu4ePu4uTv4+Xv5Obw5ujx5+jy5+ny6Ony6uvz6uz06+307O317e717/D28PH28PH38fL38/P49PX59/f69/f7+fn8+fr8+vr8+/v9+/z9/f3+/v7+////tXj2zgAAAC90Uk5TABUZGhscHR4gSUxNTlBpamtsbW5vkZiZm5yeoqq1tre419jZ2/Hy8/P0+/z9/f3OcQnQAAABfklEQVQ4y8XU6V+CMBgH8GVhl5VHd1liKSnWlOyyLEpN7bLM0uzy2P//N8SzgQ5aH172ezXGlx0wHoRYxoORaAJzSUQjAS/iM7akYkFS6xNDM6OICD4vHMd9lplPiUj+gxDyshsyxxGagw6BNFN0LEk81z1hycdHDbQqNPjVRBW8bOxdFaOGiYpYlVBIbHCBma6GsR9t2m6ltUGzDqZfNFphtM0b/YvUM9ZFqdlunEEjivi9lXvGw+1D58wK4i5qbBnfF041RFrT3A/pV/5COfgKpFWBGUlNjHT6FZ7TOP9J8b4AVfswTRWa2TdQ77lf6An6OzrrytA31NUd6Jo+ezLovIFxO2k7eoAzoXHjX8IKj+wIXtCpbT+P/4oUdxRDW+5IpofOBYVRwB3NIq/qhpISQisM3Zb5tDi0CMUibh1JR0wU88AvPKneCVGWVZZpVgxCez2BaTETtMqKb6dUduaKnpTY1LBAjSwkhUVszWOrdZJ/Q7aVF0UOz0nmzR9K1hQKHw16lQAAAABJRU5ErkJggg=='

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

const TagContainer = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
  background: ${colors.backgroundLightGrey};
  border-radius: 100px;
  padding: 2px 10px;
  font-weight: 600;
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
                    <TagContainer>
                        <Typography.Text type={'secondary'}>
                            {tag}
                        </Typography.Text>
                    </TagContainer>
                )
            }
        </CardWrapper>
    )
}