import { Col, Row } from 'antd'
import ReactECharts from 'echarts-for-react'
import Head from 'next/head'
import React from 'react'

import { Smile, Check } from '@open-condo/icons'
import { Select, Space, Typography, Card } from '@open-condo/ui'

import { PageWrapper, PageContent, PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { Table } from '@condo/domains/common/components/Table/Index'

const InfoCard = ({ text, value }) => {
    return (
        <Card width='100%'>
            <Space size={12} direction='vertical'>
                <Typography.Text size='small'>{text}</Typography.Text>
                <Typography.Title level={3}>{value}</Typography.Title>
            </Space>
        </Card>
    )
}

const BarChart = ({ title }) => {
    return <Row gutter={[8, 8]}>
        <Col span={24}><Typography.Title level={3}>{title}</Typography.Title></Col>
        <Col span={24}>
            <ReactECharts
                style={{ height: 400 }}
                opts={{ renderer: 'svg', height: 400 }}
                option={{
                    grid: [{
                        left: 30,
                        top: 30,
                        bottom: 30,
                        right: 30,
                    }],
                    x: 'left',
                    xAxis: {
                        type: 'category',
                        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    },
                    yAxis: {
                        type: 'value',
                    },
                    series: [
                        {
                            data: Array.from({ length: 7 }, () => Math.random() * 100),
                            type: 'bar',
                            showBackground: true,
                            backgroundStyle: {
                                color: 'rgba(180, 180, 180, 0.2)',
                            },
                        },
                    ],
                }}
            />
        </Col>
    </Row>
}

const HorizontalBar = ({ title }) => {
    return <Row gutter={[8, 8]}>
        <Col span={24}><Typography.Title level={3}>{title}</Typography.Title></Col>
        <Col span={24}>
            <ReactECharts
                style={{ height: 400 }}
                opts={{ renderer: 'svg', height: 400 }}
                option={{
                    grid: [{
                        left: 30,
                        top: 30,
                        bottom: 30,
                        right: 30,
                    }],
                    x: 'left',
                    yAxis: {
                        type: 'category',
                        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    },
                    xAxis: {
                        type: 'value',
                    },
                    series: [
                        {
                            data: Array.from({ length: 7 }, () => Math.random() * 100),
                            type: 'bar',
                            showBackground: true,
                            backgroundStyle: {
                                color: 'rgba(180, 180, 180, 0.2)',
                            },
                        },
                    ],
                }}
            />
        </Col>
    </Row>
}

const TableView = ({ title }) => (
    <Row gutter={[8, 8]}>
        <Col span={24}><Typography.Title level={3}>{title}</Typography.Title></Col>
        <Col span={24}>
            <Table
                tableLayout='fixed'
                size='small'
                pagination={false}
                dataSource={Array.from({ length: 4 }, (_, i) =>({
                    number: i,
                    desc: 'Все сломалось',
                    class: 'Вода',
                    add: `г Москва, ул Ленина д.1 кв ${parseInt(String(Math.random() * 100))}`,
                    stat: 'В работе',
                }) )}
                columns={[
                    { title: 'Номер', dataIndex: 'number' },
                    { title: 'Описание', dataIndex: 'desc' },
                    { title: 'Классификатор', dataIndex: 'class' },
                    { title: 'Адрес', dataIndex: 'add' },
                    { title: 'Статус', dataIndex: 'stat' },
                ]}
            />
        </Col>
    </Row>
)

const IndexPage = () => (
    <>
        <Head><title>Dashboard</title></Head>
        <PageWrapper>
            <PageHeader title={<Typography.Title>Dashboard</Typography.Title>} />
            <PageContent>
                <Row gutter={[20, 40]}>
                    <Col span={5}>
                        <Select options={[{ value: 'org', label: 'По ук' }]} value='org' />
                    </Col>
                    <Col span={8}>
                        <DateRangePicker />
                    </Col>
                    <Col span={12}>
                        <Card width='100%'>
                            <Row gutter={[20, 40]}>
                                <Col span={24}>
                                    <Typography.Text>Продуктивность сегодня</Typography.Text>
                                </Col>
                                <Col span={24}>
                                    <Row gutter={[12, 8]}>
                                        <Col flex={1}>
                                            <InfoCard text='% выполнения' value='90%' />
                                        </Col>
                                        <Col flex={1}>
                                            <InfoCard text='Новых' value={2} />
                                        </Col>
                                        <Col flex={1}>
                                            <InfoCard text='В работе' value={3} />
                                        </Col>
                                        <Col flex={1}>
                                            <InfoCard text='Закрыто' value={1} />
                                        </Col>
                                        <Col flex={1}>
                                            <InfoCard text='Возвращено' value={5} />
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Row gutter={[12, 0]}>
                            <Col flex={1}>
                                <Card>
                                    <Space direction='vertical' size={24}>
                                        <Typography.Text>Удовлетворенность заявками</Typography.Text>
                                        <Space direction='horizontal' size={8}>
                                            <Smile />
                                            <Typography.Title level={3}>Высокая</Typography.Title>
                                        </Space>
                                    </Space>
                                </Card>
                            </Col>
                            <Col flex={1}>
                                <Card>
                                    <Space direction='vertical' size={24}>
                                        <Typography.Text>Инциденты</Typography.Text>
                                        <Space direction='horizontal' size={8}>
                                            <Check />
                                            <Typography.Title level={3}>Нет массовых инцидентов</Typography.Title>
                                        </Space>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={12}>
                        <BarChart title='Заявки' />
                    </Col>
                    <Col span={12}>
                        <BarChart title='Заявки по категориям' />
                    </Col>
                    <Col span={12}>
                        <TableView title='Заявки в работе' />
                    </Col>
                    <Col span={12}>
                        <TableView title='Просроченные заявки' />
                    </Col>
                    <Col span={12}>
                        <HorizontalBar title='Заявки по ответственным' />
                    </Col>
                    <Col span={12}>
                        <HorizontalBar title='Заявки по домам' />
                    </Col>
                </Row>
            </PageContent>
        </PageWrapper>
    </>
)

export default IndexPage
