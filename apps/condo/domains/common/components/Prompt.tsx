import { FormInstance } from 'antd'
import { isEqual, pick } from 'lodash'
import { useRouter } from 'next/router'
import React, { useEffect, useState, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Modal, Button } from '@open-condo/ui'

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
    const isBackButtonClicked = useRef(false)
    const router = useRouter()

    const showModal = () => setIsModalVisible(true)
    const hideModal = () => setIsModalVisible(false)
    const handleCancel = async () => {
        isIgnoringPrompt.current = true
        hideModal()

        if (isBackButtonClicked.current) {
            router.back()
        }

        await router.push(next)
    }
    const handleSave = async () => {
        hideModal()
        const isValid = await form.validateFields()

        if (isValid) {
            isIgnoringPrompt.current = true
            formSubmit()

            if (isBackButtonClicked.current) {
                router.back()
            }
        }
    }
    // TODO(zuch): find a solution to watch for file changes and contact changes
    // as they are using custom hooks and their fields do not present on initial form state
    const isFormChanged = () => {
        const newFormFields = pick(form.getFieldsValue(), Object.keys(initialFormState.current))
        return !isEqual(initialFormState.current, newFormFields)
    }

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        // Todo(zuch): find a better way to turn off Prompt on form submit
        const oldFormSubmit = form.submit
        initialFormState.current = form.getFieldsValue()

        form.submit = async () => {
            const isValid = await form.validateFields()

            if (isValid) {
                isIgnoringPrompt.current = true
                oldFormSubmit.call(form)
            }
        }

        const onRouteChange = url => {
            if (!isIgnoringPrompt.current && isFormChanged()) {
                setNext(url)
                showModal()

                // Todo(zuch): wait for next.js implement router abort method and remove custom error
                // https://github.com/vercel/next.js/issues/2476
                throw 'Preventing form from close (ignore this error)'
            }
        }

        const handleBeforePopState = ({ as }) => {
            isBackButtonClicked.current = true

            if (!isIgnoringPrompt.current && isFormChanged()) {
                setNext(as)
                showModal()

                window.history.pushState(null, '', router.asPath)

                return false
            }
            return true
        }

        router.beforePopState(handleBeforePopState)
        router.events.on('routeChangeStart', onRouteChange)

        return () => {
            router.events.off('routeChangeStart', onRouteChange)
            router.beforePopState(null)

            form.submit = oldFormSubmit
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Modal
            open={isModalVisible}
            onCancel={hideModal}
            title={title}
            footer={[
                <Button key='back' danger type='secondary' onClick={handleCancel}>
                    {LeaveLabel}
                </Button>,
                <Button key='submit' type='primary' onClick={handleSave}>
                    {SaveLabel}
                </Button>,
            ]}
        >
            {children}
        </Modal>
    )
}

export default Prompt
