import React, { useState } from 'react'
import { Modal } from 'antd'
import { get } from 'lodash'
import { useMeterInfoModalTableColumns } from './useTableColumns'
import { Table } from '@condo/domains/common/components/Table/Index'
import { Meter } from '../utils/clientSchema'

type IMeterInfoModalProps = {
    meterId: string
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
        const columns = useMeterInfoModalTableColumns()

        return (
            <Modal
                title={address}
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