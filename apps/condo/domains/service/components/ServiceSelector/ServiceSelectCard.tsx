import React from 'react'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'

const CardContainer = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  // TODO: Recolor this after redesign
  border: 1px solid ${colors.sberGrey[0]};
  border-radius: 12px;
  overflow: hidden;
`

const ImageHolder = styled.div`
  height: 96px;
  // TODO: Recolor this after redesign
  border-bottom: 1px solid ${colors.sberGrey[0]};
`

export const ServiceSelectCard: React.FC = () => {
    return (
        <>
            <CardContainer>
                <ImageHolder/>
                asd
            </CardContainer>
        </>
    )
}