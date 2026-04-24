import { Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import dayjs from 'dayjs'
import { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography } from '@open-condo/ui'

import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'

const ARCHIVE_MODAL_DATE_PICKER_STYLE: CSSProperties = { width: '100%' }
const ARCHIVE_MODAL_DATE_PICKER_DATE_FORMAT = 'DD.MM.YYYY'
const ARCHIVE_MODAL_ROW_GUTTER: [Gutter, Gutter] = [0, 16]

type ChangeMeterStatusModalProps = {
    isShowStatusChangeModal: boolean
    handleCloseStatusChangeModal: () => void
    selectedArchiveDate: string
    handleChangeSelectedArchiveDate: (date) => void
    changeMeterStatusToArchived: () => void
}

const ChangeMeterStatusModal = ({
    isShowStatusChangeModal,
    handleCloseStatusChangeModal,
    selectedArchiveDate,
    handleChangeSelectedArchiveDate,
    changeMeterStatusToArchived,
}: ChangeMeterStatusModalProps): JSX.Element => {
    const intl = useIntl()
    const ArchiveMeterModalTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.PutToArchive.Modal.Title' })
    const ArchiveMeterButtonTextMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.PutToArchive.Modal.Text' })
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })
    const ArchiveMeterButtonMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.putOutOfOrder' })

    return (
        <Modal 
            open={isShowStatusChangeModal}
            title={ArchiveMeterModalTitleMessage}
            onCancel={handleCloseStatusChangeModal}
            footer={[
                <Button key='cancel' type='secondary' onClick={handleCloseStatusChangeModal}>
                    {CancelMessage}
                </Button>,
                <Button key='submit' type='primary' onClick={changeMeterStatusToArchived} disabled={!selectedArchiveDate}>
                    {ArchiveMeterButtonMessage}
                </Button>,
            ]}
        >
            <Row gutter={ARCHIVE_MODAL_ROW_GUTTER}>
                <Typography.Text type='secondary'>
                    {ArchiveMeterButtonTextMessage}
                </Typography.Text>
                <DatePicker
                    format={ARCHIVE_MODAL_DATE_PICKER_DATE_FORMAT}
                    style={ARCHIVE_MODAL_DATE_PICKER_STYLE}
                    onChange={handleChangeSelectedArchiveDate}
                    disabledDate={current => current && current >= dayjs()}
                />
            </Row>
        </Modal>
    )
}

export default ChangeMeterStatusModal