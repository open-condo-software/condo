/** @jsx jsx */
import { ExternalReport } from '@app/condo/schema'
import { css, jsx } from '@emotion/react'
import { Card, Typography } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'

import { fontSizes, transitions, colors, shadows } from '@condo/domains/common/constants/style'


const cardCss = css`
  border-radius: 16px;
  cursor: pointer;
  transition: ${transitions.elevateTransition};
  min-height: 124px;
  
  & .ant-card-head {
    padding: 0 28px;
  }
  
  & .ant-card-body {
    padding: 12px 28px 28px; 
  }
  
  &:hover {
    box-shadow: ${shadows.elevated};
  }
`

const CARD_HEAD_STYLE: React.CSSProperties = { fontSize: fontSizes.content, fontWeight: 700, borderBottom: 'none' }
const CARD_DESCRIPTION_STYLE: React.CSSProperties = { color: colors.textSecondary }

interface IExternalReportCardProps {
    externalReport: ExternalReport
}

const ExternalReportCard = ({ externalReport }: IExternalReportCardProps): React.ReactElement => {
    const { title, description, id } = externalReport
    const { push } = useRouter()

    const onCardClick = () => {
        push(`/reports/external/${id}`)
    }

    return (
        <Card
            title={title}
            headStyle={CARD_HEAD_STYLE}
            css={cardCss}
            onClick={onCardClick}
        >
            <Typography.Text style={CARD_DESCRIPTION_STYLE}>{description}</Typography.Text>
        </Card>
    )
}

export default ExternalReportCard
