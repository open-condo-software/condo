import React from 'react'
import { Card, Image } from 'antd'
import styled from '@emotion/styled'
// import { colors } from '@open-condo/ui/colors'
import { colors } from '@open-condo/ui/dist/colors'

const FALLBACK_IMAGE_URL = '/greyLogo.svg'

type AppCardProps = {
    name: string
    logoUrl?: string
}

const AppCardWrapper = styled.div`
  position: relative;
  cursor: pointer;
  & > .miniapp-card {
    box-sizing: border-box;
    border: 1px solid ${colors.gray['3']};
    border-radius: 12px;
    & > .ant-card-head {
      padding: 32px 40px;
      border-color: ${colors.gray['3']};
      & > .ant-card-head-wrapper {
        & > .ant-card-head-title {
          padding: 0;
          width: 100%;
          height: 60px;
          & > .ant-image {
            width: 100%;
            height: 60px;
            & > .ant-image-img {
              width: 100%;
              height: 60px;
              object-fit: contain;
            }
          }
        }
      }
    }
  }
`

export const AppCard: React.FC<AppCardProps> = ({ name, logoUrl }) => {
    return (
        <AppCardWrapper>
            <Card
                className='miniapp-card'
                title={
                    <Image
                        src={logoUrl || FALLBACK_IMAGE_URL}
                        preview={false}
                        fallback={FALLBACK_IMAGE_URL}
                    />
                }
                bordered={false}
            >
                {name}
            </Card>
        </AppCardWrapper>
    )
}