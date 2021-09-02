import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { Col, Form, Input, Row, Typography } from 'antd'
import { useState } from 'react'
import {
    REGISTER_NEW_ORGANIZATION_MUTATION,
} from '@condo/domains/organization/gql'

// {
//     ModalForm: React.FC,
//     setVisible: (arg?: any) => boolean
// }

export const useCreateMeterModal = ()=> {
    const [visible, setVisible] = useState(false)

    const ModalForm = ({ handleSubmit: _handleSubmit }) => (
        <BaseModalForm
            visible={visible}
            cancelModal={() => setVisible(false)}
            ModalTitleMsg={'Добавить счетчик'}
            ModalSaveButtonLabelMsg={'Добавить'}
            showCancelButton={false}
            validateTrigger={['onBlur', 'onSubmit']}
            handleSubmit={
                (values) => {
                    _handleSubmit(values)
                    setVisible(false)
                }
            }
        >
            <Row gutter={[0, 20]}>
                <Col span={24}>
                    <Col span={24}>
                        <Form.Item
                            label={'Лицевой счет'}
                            name='account'
                            required={true}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Form.Item
                        label={'Номер счетчика'}
                        name='number'
                        required={true}
                    >
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label={'Место установки счетчика'}
                        name='place'
                    >
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
        </BaseModalForm>
    )

    return {
        ModalForm,
        setVisible,
    }
}