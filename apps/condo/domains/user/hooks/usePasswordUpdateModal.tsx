import { Form, Input, Modal, Typography } from 'antd'
import React  from 'react'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { usePasswordUpdateValidations } from './usePasswordUpdateValidations'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 9,
    },
    wrapperCol: {
        span: 15,
    },
    style: {
        paddingBottom: '24px',
        maxWidth: '453px',
    },
}

export const usePasswordUpdateModal = () => {
    const intl = useIntl()
    const SaveMessage = intl.formatMessage({ id: 'Save' })
    const CurrentPasswordLabel = intl.formatMessage({ id: 'passwordChangeForm.current' })
    const NewPasswordLabel = intl.formatMessage({ id: 'passwordChangeForm.new' })
    const RetryPasswordLabel = intl.formatMessage({ id: 'passwordChangeForm.retry' })
    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.ChangePasswordModalTitle' })

    const [form] = Form.useForm()
    const [isModalVisible, setModalVisible] = React.useState(false)
    const validations = usePasswordUpdateValidations()

    const handlePasswordUpdate = (value) => {
        console.log('handlePasswordUpdate', value)
    }

    const updatePassword = () => {
        setModalVisible(true)
    }

    const handleCancel = () => {
        setModalVisible(false)
    }

    const initialValues = {
        oldPassword: '',
        newPassword: '',
        newPasswordRetry: '',
    }

    const ModalElement = (
        <Modal
            visible={isModalVisible}
            onCancel={handleCancel}
            title={
                <Typography.Title
                    level={3}
                    style={{ margin: 0, fontWeight: 800 }}
                >
                    {ChangePasswordLabel}
                </Typography.Title>
            }
            footer={[
                <Button key={'submit'} type={'sberPrimary'} onClick={handlePasswordUpdate}>
                    {SaveMessage}
                </Button>,
            ]}
        >
            <Form
                form={form}
                name='updatePassword'
                onFinish={handlePasswordUpdate}
                initialValues={initialValues}
                validateTrigger={['onBlur', 'onSubmit', 'onChange']}
                colon={false}
                requiredMark={false}
            >
                <Form.Item
                    validateFirst
                    {...INPUT_LAYOUT_PROPS}
                    name='oldPassword'
                    label={CurrentPasswordLabel}
                    labelAlign='left'
                    rules={validations.oldPassword}
                >
                    <Input.Password/>
                </Form.Item>
                <Form.Item
                    validateFirst
                    {...INPUT_LAYOUT_PROPS}
                    name='newPassword'
                    label={NewPasswordLabel}
                    labelAlign='left'
                    rules={validations.newPassword}
                >
                    <Input.Password/>
                </Form.Item>
                <Form.Item
                    validateFirst
                    {...INPUT_LAYOUT_PROPS}
                    name='newPasswordRetry'
                    label={RetryPasswordLabel}
                    labelAlign='left'
                    dependencies={['newPassword']}
                    rules={validations.newPasswordRetry}
                >
                    <Input.Password/>
                </Form.Item>
            </Form>
        </Modal>
    )

    return ({ updatePassword, handleCancel, ModalElement })
}
