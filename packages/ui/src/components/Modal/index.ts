import { Modal as ModalComponent } from './modal'
import { useModal } from './useModal'
import './style.less'

type CompoundedModal = typeof ModalComponent & {
    useModal: typeof useModal
}

const Modal: CompoundedModal = ModalComponent as CompoundedModal
Modal.useModal = useModal



export type { ModalProps } from './modal'
export { Modal }
