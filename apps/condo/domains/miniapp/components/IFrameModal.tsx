import React, { CSSProperties, useMemo } from 'react'
import { Modal } from 'antd'
import { IFrame } from '@condo/domains/common/components/IFrame'
import { CrossIcon }  from '@condo/domains/common/components/icons/CrossIcon'

type IIFrameModalProps = {
    id: string
    pageUrl: string
    closable: boolean
    onClose: (id: string) => void
}

const MODAL_BODY_STYLES: CSSProperties = { padding: 40 }
const MODAL_STYLES: CSSProperties = { marginTop: 40 }

const IFrameModal: React.FC<IIFrameModalProps> = React.memo((props) => {
    const { pageUrl, id, closable } = props
    const pageUrlWithParams = useMemo(() => {
        const url = new URL(pageUrl)
        url.searchParams.set('modalId', id)
        return url.toString()
    }, [pageUrl, id])

    return (
        <Modal
            // NOTE: Using unmount
            // as modal-destroy mechanism
            visible
            centered
            footer={null}
            bodyStyle={MODAL_BODY_STYLES}
            style={MODAL_STYLES}
            onCancel={() => {
                console.log('CANCEL')
            }}
            closeIcon={<CrossIcon/>}
            closable={false}
        >
            <IFrame
                pageUrl={pageUrlWithParams}
                options={{ withPreFetch: false }}
            />
        </Modal>
    )
})

IFrameModal.displayName = 'IFrameModal'

export default IFrameModal