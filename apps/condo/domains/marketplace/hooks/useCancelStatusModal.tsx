import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'


const CancelStatusModal = ({ open, onCancel, onButtonClick }) => {
    const intl = useIntl()
    const CancelInvoiceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.cancelInvoiceMessage' })
    const CancelInvoiceDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.cancelInvoiceDescription' })
    const CancelInvoiceButtonMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.cancelInvoiceButton' })

    return (
        <Modal
            title={CancelInvoiceMessage}
            open={open}
            onCancel={onCancel}
            footer={[
                <Button
                    onClick={onButtonClick}
                    key='submit'
                    type='primary'
                    color={colors.red[5]}
                >
                    {CancelInvoiceButtonMessage}
                </Button>,
            ]}
        >
            <Typography.Text type='secondary'>
                {CancelInvoiceDescription}
            </Typography.Text>
        </Modal>
    )
}

type CancelModalPropsType = {
    onButtonClick: () => void
}

export const useCancelStatusModal = () => {
    const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false)

    const Modal: React.FC<CancelModalPropsType> = useCallback((props) => (
        <CancelStatusModal
            open={isCancelModalOpen}
            onCancel={() => {
                setIsCancelModalOpen(false)
            }}
            onButtonClick={() => {
                props.onButtonClick()

                setIsCancelModalOpen(false)
            }}
        />
    ), [isCancelModalOpen])

    return useMemo(
        () => ({ setIsCancelModalOpen, CancelStatusModal: Modal }),
        [Modal])
}