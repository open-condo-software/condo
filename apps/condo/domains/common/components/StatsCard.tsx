/** @jsx jsx */
import React, { useCallback, useEffect, useState } from 'react'
import { Card as AntCard, CardProps, Col, Dropdown, Menu, Row, Skeleton, Space } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { Button } from './Button'
import Router from 'next/router'
import { css, jsx } from '@emotion/core'
import { colors } from '@condo/domains/common/constants/style'
import { useIntl } from '@core/next/intl'

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

const Card: React.FC<CardProps> = (props) => {
    const { children, ...allProps } = props
    return <AntCard css={cardCss} {...allProps}>{children}</AntCard>
}

export const StatsCard: React.FC<IStatsCardProps> = ({ title, children, link, loading = false, onFilterChange, dependencyArray }) => {
    const intl = useIntl()
    const extraTitle = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })
    const SELECTED_PERIOD = {
        week: intl.formatMessage({ id: 'component.statscard.periodtypes.Week' }),
        month: intl.formatMessage({ id: 'component.statscard.periodtypes.Month' }),
        quarter: intl.formatMessage({ id: 'component.statscard.periodtypes.Quarter' }),
        year: intl.formatMessage({ id: 'component.statscard.periodtypes.Year' }),
    }

    const [selectedPeriod, setSelectedPeriod] = useState<string>(Object.keys(SELECTED_PERIOD)[0])
    const updateDependencies = [selectedPeriod, ...dependencyArray]

    useEffect(() => {
        onFilterChange(selectedPeriod)
    }, updateDependencies)

    const menu = (
        <Menu onClick={({ key }) => setSelectedPeriod(key)} disabled={loading}>
            {Object.keys(SELECTED_PERIOD).map((period, key) => <Menu.Item key={period}>{SELECTED_PERIOD[period]}</Menu.Item>)}
        </Menu>
    )

    const cardTitle = (
        <Space css={cardTitleCss}>
            {title}
            <Dropdown overlay={menu} >
                <span style={{ color: colors.green[6] }}>{SELECTED_PERIOD[selectedPeriod]} <DownOutlined /></span>
            </Dropdown>
        </Space>
    )

    const linkClick = useCallback(
        () => Router.push(link),
        [link],
    )

    const cardExtra = (
        <Button style={{ fontSize: 16, fontWeight: 700 }} type={'inlineLink'} onClick={linkClick}>
            {extraTitle}{<RightOutlined />}
        </Button>
    )

    return (
        <Row gutter={[0, 40]} align={'middle'}>
            <Col span={24}>
                <Card
                    title={cardTitle}
                    bordered={false}
                    headStyle={{ fontSize: 20, fontWeight: 700, borderBottom: 'none' }}
                    extra={cardExtra}
                >
                    {loading ? <Skeleton active round paragraph={{ rows: 1 }} /> : children}
                </Card>
            </Col>
        </Row>
    )
}
