import React, { useState } from 'react'
import { Modal, Typography } from 'antd'
import { get } from 'lodash'
import { useMeterInfoModalTableColumns } from './useTableColumns'
import { Table } from '@condo/domains/common/components/Table/Index'
import { Meter } from '../utils/clientSchema'
import { useIntl } from '@core/next/intl'

type IMeterInfoModalProps = {
    meterId: string
}

const MeterTitle = ({ address, meterNumber }) => {
    const intl = useIntl()
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.NumberOfMeter' })

    return (
        <>
            <Typography.Title level={3}>{address}</Typography.Title>
            <Typography.Text type={'secondary'} style={{ fontSize: '14px' }}>
                {MeterNumberMessage} {meterNumber}
            </Typography.Text>
        </>
    )
}

export const useMeterInfoModal = () => {
    const [isMeterInfoModalVisible, setIsMeterInfoModalVisible] = useState<boolean>()

    const MeterInfoModal = ({ meterId }: IMeterInfoModalProps) => {
        const { obj: meter, loading: meterLoading } = Meter.useObject({
            where: {
                id: meterId ? meterId : null,
            },
        })

        const address = get(meter, ['property', 'address'])
        const meterNumber = get(meter, 'number')

        const columns = useMeterInfoModalTableColumns()

        return (
            <Modal
                title={<MeterTitle address={address} meterNumber={meterNumber} />}
                visible={isMeterInfoModalVisible}
                centered
                footer={null}
                onCancel={() => setIsMeterInfoModalVisible(false)}
                width={800}
            >
                <Table
                    pagination={false}
                    loading={meterLoading}
                    totalRows={1}
                    columns={columns}
                    dataSource={[meter]}
                />
            </Modal>
        )
    }

    return { MeterInfoModal, setIsMeterInfoModalVisible }
}