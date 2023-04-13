import { Row, Col, Progress } from 'antd'
import isNull from 'lodash/isNull'
import React from 'react'

import { AlertCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Space } from '@open-condo/ui'

import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { colors } from '@condo/domains/common/constants/style'

import type { PropertyReportTypes } from './BankCostItemContext'
import type { RowProps } from 'antd'

const CATEGORY_PROGRESS_ROW_GUTTER: RowProps['gutter'] = [24, 20]
const CATEGORY_PROGRESS_ICON_WRAPPER_STYLE: React.CSSProperties = { display: 'flex' }

interface ICategoryProgress {
    ({ totalRows, entity, emptyRows }: {
        totalRows: number,
        entity: PropertyReportTypes,
        emptyRows?: number
    }): React.ReactElement
}

const CategoryProgress: ICategoryProgress = ({ totalRows, entity, emptyRows }) => {
    const intl = useIntl()
    const TransactionTitle = intl.formatMessage({ id: 'pages.banking.categoryProgress.title.transaction' })
    const ContractorTitle = intl.formatMessage({ id: 'pages.banking.categoryProgress.title.contractor' })
    const TransactionTooltipTitle = intl.formatMessage({ id: 'pages.banking.categoryProgress.tooltip.transaction' })
    const ContractorTooltipTitle = intl.formatMessage({ id: 'pages.banking.categoryProgress.tooltip.contractor' })

    let activeEntity = TransactionTitle
    let tooltipTitle = TransactionTooltipTitle

    if (entity === 'contractor') {
        activeEntity = ContractorTitle
        tooltipTitle = ContractorTooltipTitle
    }

    const percent = Math.round( (totalRows - emptyRows) / totalRows * 100)

    if (!emptyRows || isNull(totalRows) || emptyRows === 0 || totalRows === 0 || percent === 100 || totalRows < emptyRows) {
        return null
    }

    return (
        <Col span={24}>
            <Row gutter={CATEGORY_PROGRESS_ROW_GUTTER} justify='space-between'>
                <Col>
                    <Space direction='horizontal' size={12} align='center'>
                        <Typography.Text>
                            {intl.formatMessage({ id: 'pages.banking.categoryProgress.title' }, {
                                entity: activeEntity,
                            })}
                        </Typography.Text>
                        <Tooltip title={tooltipTitle}>
                            <div style={CATEGORY_PROGRESS_ICON_WRAPPER_STYLE}><AlertCircle size='medium'/></div>
                        </Tooltip>
                    </Space>
                </Col>
                <Col>
                    <Typography.Text type='danger' size='small'>
                        {intl.formatMessage({ id: 'pages.banking.categoryProgress.description' }, {
                            percent: 100 - percent,
                        })}
                    </Typography.Text>
                </Col>
                <Col span={24}>
                    <Progress
                        type='line'
                        showInfo={false}
                        trailColor={colors.warningText}
                        strokeColor={colors.infoIconColor}
                        percent={percent}
                    />
                </Col>
            </Row>
        </Col>
    )
}

export default CategoryProgress
