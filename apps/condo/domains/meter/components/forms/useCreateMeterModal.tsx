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

export const useCreateMeterModal = ({ handleSubmit: _handleSubmit })=> {
    const [visible, setVisible] = useState(false)

    const handleSubmit = (values) => {
        if (_handleSubmit) {
            _handleSubmit(values)
        }
        setVisible(false)
    }

    const ModalForm: React.FC = () => (
        <BaseModalForm
            // mutation={REGISTER_NEW_ORGANIZATION_MUTATION}
            // formValuesToMutationDataPreprocessor={(values) => {
            //     const { name, inn } = values
            //     return convertUIStateToGQLItem({
            //         name,
            //         meta: { v: 1, inn },
            //     })
            // }}
            // onMutationCompleted={(result) => {
            //     // onFinish(result)
            //     setVisible(false)
            // }}
            visible={visible}
            cancelModal={() => setVisible(false)}
            ModalTitleMsg={'Добавить счетчик'}
            ModalSaveButtonLabelMsg={'Добавить'}
            showCancelButton={false}
            validateTrigger={['onBlur', 'onSubmit']}
            handleSubmit={handleSubmit}
        >
            <Row gutter={[0, 20]}>
                <Col span={24}>
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