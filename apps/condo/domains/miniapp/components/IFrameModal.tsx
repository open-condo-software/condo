import React, { CSSProperties, useCallback, useMemo } from 'react'

import { Modal } from '@condo/domains/common/components/Modal'
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
const IFRAME_OPTIONS = { withPreFetch: false }

const IFrameModal: React.FC<IIFrameModalProps> = React.memo((props) => {
    const { pageUrl, id, closable, onClose } = props
    const pageUrlWithParams = useMemo(() => {
        const url = new URL(pageUrl)
        url.searchParams.set('modalId', id)
        return url.toString()
    }, [pageUrl, id])

    const handleClose = useCallback(() => {
        if (closable) {
            onClose(id)
        }
    }, [closable, id, onClose])

    return (
        <Modal
            // NOTE: Using unmount
            // as modal-destroy mechanism
            visible
            centered
            footer={null}
            bodyStyle={MODAL_BODY_STYLES}
            style={MODAL_STYLES}
            onCancel={handleClose}
            closeIcon={<CrossIcon/>}
            closable={closable}
        >
            <IFrame
                pageUrl={pageUrlWithParams}
                options={IFRAME_OPTIONS}
            />
        </Modal>
    )
})

IFrameModal.displayName = 'IFrameModal'

export default IFrameModal