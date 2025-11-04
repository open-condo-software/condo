import styled from '@emotion/styled'
import { ConfigProvider } from 'antd'
import React, { useContext } from 'react'

const PreviewWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid #FFEDE3;
  background-color: #FFEDE3;
  padding: 0 40px;
`

const ImageWrapper = styled.div`
  height: 314px;
  overflow: hidden;
`

const Image = styled.img`
  height: 100%;
  width: 100%;
  object-fit: contain;
`

export const TicketDeadlinePreview: React.FC = () => {
    const { locale: { locale } } = useContext(ConfigProvider.ConfigContext)

    if (locale !== 'ru' ) return null

    return (
        <PreviewWrapper>
            <ImageWrapper>
                <Image
                    src='/ticketDeadlinePreview_ru.png'
                    alt='ticketDeadlinePreview'
                />
            </ImageWrapper>
        </PreviewWrapper>
    )
}
