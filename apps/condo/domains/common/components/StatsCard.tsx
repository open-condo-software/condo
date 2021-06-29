/** @jsx jsx */
import React, { useCallback, useState } from 'react'
import { Card as AntCard, CardProps, Col, Dropdown, Menu, Row, Skeleton } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { Button } from './Button'
import Router from 'next/router'
import { css, jsx } from '@emotion/core'

interface IStatsCardProps {
    title: string;
    link: string;
    loading: boolean;
}
const SELECTED_PERIOD_MAP = ['неделю', 'квартал', 'год']

const cardCss = css`
  box-shadow: 0 9px 28px rgba(0, 0, 0, 0.05), 
    0 6px 16px rgba(0, 0, 0, 0.08), 
    0 3px 6px rgba(0, 0, 0, 0.12);
  border-radius: 8px;
`

const Card: React.FC<CardProps> = (props) => {
    const { children, ...allProps } = props
    return <AntCard css={cardCss} {...allProps}>{children}</AntCard>
}

export const StatsCard: React.FC<IStatsCardProps> = ({ title, children, link, loading }) => {
    const [selectedPeriod, setSelectedPeriod] = useState<number>(0)

    const menu = (
        <Menu onClick={({ key }) => setSelectedPeriod(parseInt(key))} disabled={loading}>
            {SELECTED_PERIOD_MAP.map((period, key) => <Menu.Item key={key}>{period}</Menu.Item>)}
        </Menu>
    )

    const cardTitle = (
        <span>
            {title}&nbsp;
            <Dropdown overlay={menu} >
                <span style={{ color: 'green' }}>{SELECTED_PERIOD_MAP[selectedPeriod]} <DownOutlined /></span>
            </Dropdown>
        </span>
    )

    const linkClick = useCallback(
        () => Router.push(link),
        [link],
    )

    const cardExtra = (
        <Button style={{ fontSize: 16, fontWeight: 700 }} type={'inlineLink'} onClick={linkClick}>
            Подробнее{<RightOutlined />}
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
                >{loading ? <Skeleton active round paragraph={{ rows: 1 }} /> : children}</Card>
            </Col>
        </Row>
    )
}
