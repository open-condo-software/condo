/** @jsx jsx */
import React from 'react'
import { css, jsx } from '@emotion/react'
import { useRouter } from 'next/router'
import { Card, Typography } from 'antd'
import { fontSizes, transitions, colors } from '@condo/domains/common/constants/style'
import { ExternalReport } from '@app/condo/schema'

const cardCss = css`
  border-radius: 8px;
  cursor: pointer;
  transition: ${transitions.elevateTransition};
  
  &:hover {
    box-shadow: 0 9px 28px rgba(0, 0, 0, 0.05),
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 6px rgba(0, 0, 0, 0.12);
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
