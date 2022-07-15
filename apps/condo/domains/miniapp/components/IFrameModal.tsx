import React, { CSSProperties } from 'react'
import { Modal } from 'antd'
import { IFrame } from '@condo/domains/common/components/IFrame'

type IIFrameModalProps = {
    id: string
    pageUrl: string
    onClose: (id: string) => void
}

const MODAL_BODY_STYLES: CSSProperties = { padding: 40 }
const MODAL_STYLES: CSSProperties = { marginTop: 40 }

export const IFrameModal: React.FC<IIFrameModalProps> = (props) => {
    const { pageUrl } = props
    return (
        <Modal
            // NOTE: Using unmount
            // as modal-destroy mechanism
            // visible
            centered
            footer={null}
            bodyStyle={MODAL_BODY_STYLES}
            style={MODAL_STYLES}
            onCancel={() => {
                console.log('CANCEL')
            }}
        >
            <IFrame
                pageUrl={pageUrl}
                options={{ withPreFetch: false }}
            />
        </Modal>
    )
}