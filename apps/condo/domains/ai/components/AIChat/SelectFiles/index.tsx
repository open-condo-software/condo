import React, { useCallback, useState } from 'react'

import { SelectDocumentsModal } from './SelectDocumentsModal'


export const SelectFiles: React.FC<any> = ({
    onSelect,
    children,
}) => {

    const [isOpenModal, setOpenModal] = useState<boolean>(false)

    const openModal = useCallback(() => setOpenModal(true), [])

    return (
        <>
            <SelectDocumentsModal
                open={isOpenModal}
                setOpen={setOpenModal}
                onSelect={onSelect}
            />
            <div style={{ display: 'flex' }} onClick={openModal}>
                {children}
            </div>
        </>
    )
}