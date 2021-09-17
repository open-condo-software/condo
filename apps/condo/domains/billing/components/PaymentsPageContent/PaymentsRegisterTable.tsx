import React from 'react'
import { Row, Col } from 'antd'
import { Table, DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { usePaymentsTableColumns } from '@condo/domains/billing/hooks/usePaymentsTableColumns'
import { objs } from './fakeData'

export const PaymentsRegisterTable: React.FC = () => {
    // TODO (savelevMatthew): add currencies here
    const columns = usePaymentsTableColumns('$', '.')

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <Table
                    loading={false}
                    totalRows={DEFAULT_PAGE_SIZE * 50}
                    dataSource={objs}
                    columns={columns}
                />
            </Col>
        </Row>
    )
}