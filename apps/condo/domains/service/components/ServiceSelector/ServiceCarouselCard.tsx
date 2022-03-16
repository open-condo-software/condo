import React  from 'react'
import { Image, Card } from 'antd'
import styled from '@emotion/styled'

interface ServiceCarouselCardTitleProps {
    logoSrc?: string
}

interface ServiceCarouselCardProps extends ServiceCarouselCardTitleProps {
    tag?: string
}

// NOTE: Wrapper to fix inner css, since we cannot access title container from headStyle
const CardWrapper = styled.div`
  & .ant-card-head {
    width: 100%;
    height: 100%;
    padding: 30px;
    &> .ant-card-head-wrapper {
      &> .ant-card-head-title {
        position: relative;
        width: 100%;
        height: 36px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
`

export const ServiceCarouselCard: React.FC<ServiceCarouselCardProps> = ({ logoSrc }) => {
    return (
        <CardWrapper>
            <Card
                title={<Image src={logoSrc} style={{ objectFit: 'contain' }} preview={false}/>}
                bordered={false}
            >

            </Card>
        </CardWrapper>
    )
}