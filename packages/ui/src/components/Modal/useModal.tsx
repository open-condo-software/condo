/**
 * Original antd implementation: https://github.com/ant-design/ant-design/tree/4.x-stable/components/modal/useModal
 * Replaced info / warn dialogs with simpler Modal component using onCancel prop
 * Also added a bit more type safety and proper hook deps
 */

import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { Modal } from './modal'

import { usePatchElement } from '../_utils/hooks'

import type { ModalProps } from './modal'

type AnyArgs = Array<any>

type ModalConfig = Omit<ModalProps, 'open'> & {
    onCancel?: (...args: AnyArgs) => any
}

let modalCounter = 0

interface ElementsHolderRef {
    patchElement: ReturnType<typeof usePatchElement>[1]
}

const ElementsHolder = React.memo(
    React.forwardRef<ElementsHolderRef>((_props, ref) => {
        const [elements, patchElement] = usePatchElement()
        useImperativeHandle(ref, () => ({ patchElement }), [patchElement])

        return <>{elements}</>
    })
)

ElementsHolder.displayName = 'ModalContainer'

interface HookModalProps {
    afterClose: () => void;
    config: ModalConfig;
}

interface HookModalRef {
    destroy: () => void;
    update: (config: ModalConfig) => void;
}

const HookModal = React.forwardRef<HookModalRef, HookModalProps>((
    { afterClose, config },
    ref
) => {
    const [open, setOpen] = useState(true)
    const [innerConfig, setInnerConfig] = useState(config)

    const close = useCallback((...args: AnyArgs) => {
        setOpen(false)
        if (innerConfig.onCancel) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            innerConfig.onCancel(() => {}, ...args.slice(1))
        }

        // NOTE: Condo modal -> antd modal -> rc-dialog. So afterClose is a function from rc-dialog,
        // which should be triggered on visible (open) prop changes. However, for now it doesn't trigger,
        // so we call it manually.
        // SRC: https://github.com/react-component/dialog/blob/master/src/Dialog/index.tsx#L99
        afterClose()
    }, [innerConfig, afterClose])

    useImperativeHandle(ref, () => ({
        destroy: close,
        update: (config: ModalConfig) => {
            setInnerConfig(prev => ({
                ...prev,
                ...config,
            }))
        },
    }), [close])

    return (
        <Modal {...innerConfig} onCancel={close} open={open} afterClose={afterClose}/>
    )
})

HookModal.displayName = 'HookModal'

type UpdateModalFunc = (newConfig: ModalConfig) => void
type DestroyModalFunc = () => void
type ShowModalFunc = (config: ModalConfig) => { update: UpdateModalFunc, destroy: DestroyModalFunc }

export function useModal (): [ShowModalFunc, React.ReactElement] {
    const holderRef = useRef<ElementsHolderRef>(null)

    const [actionQueue, setActionQueue] = useState<Array<() => void>>([])
    useEffect(() => {
        if (actionQueue.length) {
            const cloneQueue = [...actionQueue]
            cloneQueue.forEach(action => {
                action()
            })
            setActionQueue([])
        }
    }, [actionQueue])


    const show = useCallback((config: ModalConfig) => {
        modalCounter++
        const modalRef = React.createRef<HookModalRef>()

        // eslint-disable-next-line prefer-const
        let closeFn: (() => void) | undefined

        const modal = (
            <HookModal
                key={modalCounter}
                ref={modalRef}
                afterClose={() => {
                    closeFn?.()
                }}
                config={config}
            />
        )

        closeFn = holderRef.current?.patchElement(modal)

        return {
            destroy () {
                function destroyAction () {
                    modalRef.current?.destroy()
                }
                if (modalRef.current) {
                    modalRef.current.destroy()
                } else {
                    setActionQueue(prev => [...prev, destroyAction])
                }
            },
            update (newConfig: ModalConfig) {
                function updateAction () {
                    modalRef.current?.update(newConfig)
                }

                if (modalRef.current) {
                    modalRef.current.update(newConfig)
                } else {
                    setActionQueue(prev => [...prev, updateAction])
                }
            },
        }
    }, [])

    // eslint-disable-next-line react/jsx-key
    return [show, <ElementsHolder ref={holderRef}/>]
}