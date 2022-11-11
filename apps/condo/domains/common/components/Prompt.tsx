import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { isEqual, pick } from 'lodash'
import { FormInstance } from 'antd'

import { Modal } from '@condo/domains/common/components/Modal'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@condo/domains/common/components/Button'

interface IPromptProps {
    title: string
    form: FormInstance<unknown>
    handleSave: () => void
}


const Prompt: React.FC<IPromptProps> = ({ children, title, form, handleSave: formSubmit }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'pages.condo.warning.modal.SaveLabel' })
    const LeaveLabel = intl.formatMessage({ id: 'pages.condo.warning.modal.LeaveLabel' })
    const [next, setNext] = useState(null)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const isIgnoringPrompt = useRef(false)
    const initialFormState = useRef({})
    const router = useRouter()
    const showModal = () => setIsModalVisible(true)
    const hideModal = () => setIsModalVisible(false)
    const handleCancel = () => {
        isIgnoringPrompt.current = true
        hideModal()
        router.push(next)
    }
    const handleSave = () => {
        isIgnoringPrompt.current = true
        hideModal()
        formSubmit()
    }
    // TODO(zuch): find a solution to watch for file changes and contact changes
    // as they are using custom hooks and their fields do not present on initial form state
    const isFormChanged = () => {
        const newFormFields = pick(form.getFieldsValue(), Object.keys(initialFormState.current))
        return !isEqual(initialFormState.current, newFormFields)
    }
    useEffect(() => {
        initialFormState.current = form.getFieldsValue()
        // Todo(zuch): find a better way to turn off Prompt on form submit
        const oldFormSubmit = form.submit
        form.submit = () => {
            isIgnoringPrompt.current = true
            oldFormSubmit.call(form)
        }
        const onRouteChange = url => {
            if (!isIgnoringPrompt.current) {
                if (isFormChanged()) {
                    setNext(url)
                    showModal()
                    // Todo(zuch): wait for next.js implement router abort method and remove custom error
                    // https://github.com/vercel/next.js/issues/2476
                    throw 'Preventing form from close (ignore this error)'
                }
            }
        }
        router.events.on('routeChangeStart', onRouteChange)
        return () => {
            router.events.off('routeChangeStart', onRouteChange)
            form.submit = oldFormSubmit
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <Modal
            visible={isModalVisible}
            onCancel={hideModal}
            title={title}
            centered
            footer={[
                <Button key='back' type='sberDanger' style={{ margin: '16px' }} onClick={handleCancel}>
                    {LeaveLabel}
                </Button>,
                <Button key='submit' type='sberPrimary' onClick={handleSave}>
                    {SaveLabel}
                </Button>,
            ]}
        >
            {children}
        </Modal>

    )
}

export default Prompt
