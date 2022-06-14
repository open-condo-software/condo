/** @jsx jsx */
import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { css, jsx } from '@emotion/react'
import Router from 'next/router'
import { Card as AntCard, CardProps, Col, Dropdown, Menu, Row, RowProps, Skeleton, Space } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { TicketReportPeriodType } from '@app/condo/schema'
import { Button } from './Button'

interface IStatsCardProps {
    title: string;
    link: string;
    loading?: boolean;
    onFilterChange: (filter: string) => void;
    dependencyArray: string[] | number[];
}

const cardCss = css`
  box-shadow: 0 9px 28px rgba(0, 0, 0, 0.05),
  0 6px 16px rgba(0, 0, 0, 0.08),
  0 3px 6px rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  min-height: 210px;
`

const cardTitleCss = css`
  cursor: pointer;
`
const STATS_CARD_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const CARD_HEAD_STYLE: React.CSSProperties = { fontSize: 20, fontWeight: 700, borderBottom: 'none' }
const CARD_EXTRA_STYLE: React.CSSProperties = { fontSize: fontSizes.content, fontWeight: 700 }
const DROPDOWN_TEXT_STYLE: React.CSSProperties = { color: colors.green[6] }

const Card: React.FC<CardProps> = (props) => {
    const { children, ...allProps } = props
    return <AntCard css={cardCss} {...allProps}>{children}</AntCard>
}

type SelectedPeriod = Record<TicketReportPeriodType, string>

export const StatsCard: React.FC<IStatsCardProps> = (props) => {
    const intl = useIntl()
    const extraTitle = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })
    const SELECTED_PERIOD: SelectedPeriod = {
        calendarWeek: intl.formatMessage({ id: 'component.statscard.periodtypes.Week' }),
        month: intl.formatMessage({ id: 'component.statscard.periodtypes.Month' }),
        quarter: intl.formatMessage({ id: 'component.statscard.periodtypes.Quarter' }),
        year: intl.formatMessage({ id: 'component.statscard.periodtypes.Year' }),
    }

    const { title, children, link, loading = false, onFilterChange, dependencyArray } = props

    const [selectedPeriod, setSelectedPeriod] = useState<string>(Object.keys(SELECTED_PERIOD)[0])
    const updateDependencies = [selectedPeriod, ...dependencyArray]

    useEffect(() => {
        onFilterChange(selectedPeriod)
    }, updateDependencies)

    const menuClick = useCallback(({ key }) => { setSelectedPeriod(key)}, [])
    const linkClick = useCallback(() => { Router.push(link) }, [link])

    const menuOverlay = (
        <Menu onClick={menuClick} disabled={loading}>
            {
                Object.keys(SELECTED_PERIOD).map((period) => (
                    <Menu.Item key={period}>{SELECTED_PERIOD[period]}</Menu.Item>
                ))
            }
        </Menu>
    )

    const cardTitle = (
        <Space css={cardTitleCss}>
            {title}
            <Dropdown overlay={menuOverlay} >
                <span style={DROPDOWN_TEXT_STYLE}>{SELECTED_PERIOD[selectedPeriod]} <DownOutlined /></span>
            </Dropdown>
        </Space>
    )

    const cardExtra = (
        <Button style={CARD_EXTRA_STYLE} type={'inlineLink'} onClick={linkClick}>
            {extraTitle}{<RightOutlined />}
        </Button>
    )

    return (
        <Row gutter={STATS_CARD_ROW_GUTTER} align={'middle'}>
            <Col span={24}>
                <Card
                    title={cardTitle}
                    bordered={false}
                    headStyle={CARD_HEAD_STYLE}
                    extra={cardExtra}
                >
                    {loading ? <Skeleton active round paragraph={{ rows: 1 }} /> : children}
                </Card>
            </Col>
        </Row>
    )
}
