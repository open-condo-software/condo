import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { Col, Form, Input, Row } from 'antd'
import { useState } from 'react'


export const useCreateMeterModalOLD = ()=> {
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)

    const CreateModal = ({ handleSubmit: _handleSubmit }) => (
        <BaseModalForm
            visible={isCreateModalVisible}
            cancelModal={() => setIsCreateModalVisible(false)}
            ModalTitleMsg={'Добавить счетчик'}
            ModalSaveButtonLabelMsg={'Добавить'}
            showCancelButton={false}
            validateTrigger={['onBlur', 'onSubmit']}
            handleSubmit={
                (values) => {
                    _handleSubmit(values)
                    setIsCreateModalVisible(false)
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
        CreateModal,
        setIsCreateModalVisible,
    }
}