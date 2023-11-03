import { Table, Row, Col, RowProps } from 'antd'
import React from 'react'
import { useIntl } from 'react-intl'

import { PlusCircle } from '@open-condo/icons'
import { Button } from '@open-condo/ui'

import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'

const BUTTON_ROW_GUTTER: RowProps['gutter'] = [60, 60]
const FULL_COL_SPAN = 24
const PAGE_SIZE = 20
const PAGINATION_POSITION = ['bottomLeft' as const]

export const BuildsSection: React.FC<{ id: string }> = () => {
    const intl = useIntl()
    const BuildsTitle = intl.formatMessage({ id: 'apps.b2c.sections.builds.title' })
    const VersionColumnTitle = intl.formatMessage({ id: 'apps.b2c.sections.builds.columns.version.title' })
    const SizeColumnTitle = intl.formatMessage({ id: 'apps.b2c.sections.builds.columns.size.title' })
    const AddBuildLabel = intl.formatMessage({ id: 'apps.b2c.sections.builds.action.addBuild' })

    const columns = [
        {
            title: VersionColumnTitle,
            dataIndex: 'version',
            key: 'version',
            width: '70%',
        },
        {
            title: SizeColumnTitle,
            dataIndex: 'size',
            key: 'size',
            width: '30%',
        },
    ]

    return (
        <Section>
            <SubSection title={BuildsTitle}>
                <Row gutter={BUTTON_ROW_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <Table
                            columns={columns}
                            bordered
                            dataSource={[
                                { size: '30Mb', version: '1.0.0-development' },
                                { size: '30Mb', version: '1.0.0-prod' },
                            ]}
                            pagination={{
                                pageSize: PAGE_SIZE,
                                position: PAGINATION_POSITION,
                                showSizeChanger: false,
                                total: 200,
                                simple: true,
                            }}
                        />
                    </Col>
                    <Col span={FULL_COL_SPAN}>
                        <Button type='primary' icon={<PlusCircle size='medium'/>}>{AddBuildLabel}</Button>
                    </Col>
                </Row>
            </SubSection>
        </Section>
    )
}