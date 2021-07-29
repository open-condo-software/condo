import { Modal } from 'antd'
import React, { useState, Dispatch, SetStateAction } from 'react'

interface ICreateOrganizationModalFormResult {
    ModalForm: React.FC
    setVisible: Dispatch<SetStateAction<boolean>>
}

export const useSubscriptionModalForm = (): ICreateOrganizationModalFormResult => {
    const [visible, setVisible] = useState<boolean>(false)

    const ModalForm: React.FC = () => (
        <Modal visible={visible}>
        </Modal>
    )

    return {
        ModalForm,
        setVisible,
    }
}
