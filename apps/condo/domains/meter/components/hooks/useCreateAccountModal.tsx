import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { Form, Input } from 'antd'
import React, { useState } from 'react'
import { useIntl } from '@core/next/intl'


export const useCreateAccountModal = ()=> {
    const intl = useIntl()
    const AccountMessage = intl.formatMessage({ id: 'pages.condo.meter.Account' })
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })
    const AddMessage = intl.formatMessage({ id: 'Add' })

    const [isCreateAccountModalVisible, setIsCreateAccountModalVisible] = useState(false)

    const CreateAccountModal = ({ accountNumber, setAccountNumber }) => (
        <BaseModalForm
            visible={isCreateAccountModalVisible}
            cancelModal={() => setIsCreateAccountModalVisible(false)}
            ModalTitleMsg={AccountMessage}
            ModalSaveButtonLabelMsg={AddMessage}
            showCancelButton={false}
            validateTrigger={['onBlur', 'onSubmit']}
            handleSubmit={
                (values) => {
                    console.log('values', values)
                    setAccountNumber(values.accountNumber)
                    setIsCreateAccountModalVisible(false)
                }
            }
        >
            <Form.Item
                label={AccountNumberMessage}
                name='accountNumber'
                required={true}
            >
                <Input />
            </Form.Item>
        </BaseModalForm>
    )

    return {
        CreateAccountModal,
        setIsCreateAccountModalVisible,
    }
}