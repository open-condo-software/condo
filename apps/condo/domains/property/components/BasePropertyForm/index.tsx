// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import { Col, Form, Input, notification, Row, Typography } from 'antd'
import React from 'react'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { AddressSearchInput } from '@condo/domains/common/components/AddressSearchInput'
import { AddressMetaCache } from '@condo/domains/common/utils/addressApi'
import { PropertyPanels } from '../panels'
import Prompt from '@condo/domains/common/components/Prompt'


interface IOrganization {
    id: string
}

interface IPropertyFormProps {
    organization: IOrganization
    initialValues?: IPropertyFormState
    action?: (...args) => void
    type: string
}

const BasePropertyForm: React.FC<IPropertyFormProps> = (props) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const NameMsg = intl.formatMessage({ id: 'pages.condo.property.form.field.Name' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.AddressMetaParse' })

    const PromptTitle = intl.formatMessage({ id: 'pages.condo.property.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.property.warning.modal.HelpMessage' })

    const { action, initialValues } = props

    const formValuesToMutationDataPreprocessor = React.useCallback((formData, _, form) => {
        const isAddressFieldTouched = form.isFieldsTouched(['address'])

        if (isAddressFieldTouched) {
            const addressMeta = AddressMetaCache.get(formData.address)

            if (!addressMeta) {
                notification.error({
                    message: ServerErrorMsg,
                    description: AddressMetaError,
                })

                throw new Error(AddressMetaError)
            }

            return { ...formData, addressMeta: { dv: 1, ...addressMeta } }
        }

        return formData
    }, [initialValues])

    return (
        <>
            <FormWithAction
                action={action}
                initialValues={initialValues}
                validateTrigger={['onBlur', 'onSubmit']}
                formValuesToMutationDataPreprocessor={formValuesToMutationDataPreprocessor}
            >
                {({ handleSave, isLoading, form }) => {
                    return (
                        <>
                            <Prompt
                                title={PromptTitle}
                                form={form}
                                handleSave={handleSave}
                            >
                                <Typography.Paragraph>
                                    {PromptHelpMessage}
                                </Typography.Paragraph>
                            </Prompt>
                            <Row gutter={[0, 40]}>
                                <Col span={7} >
                                    <Form.Item
                                        name="address"
                                        label={AddressLabel}
                                        rules={[{ required: true, message: FieldIsRequiredMsg }]}
                                    >
                                        <AddressSearchInput />
                                    </Form.Item>
                                </Col>
                                <Col span={7} offset={1}>
                                    <Form.Item
                                        name="name"
                                        label={NameMsg}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={24} >
                                    <Form.Item name='map' hidden >
                                        <Input />
                                    </Form.Item>
                                    <Form.Item shouldUpdate={true}>
                                        {
                                            ({ getFieldsValue, setFieldsValue }) => {
                                                const { map } = getFieldsValue(['map'])
                                                return (
                                                    <PropertyPanels mode='edit' map={map} updateMap={ map =>  setFieldsValue({ map })} />
                                                )
                                            }
                                        }
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    {props.children({ handleSave, isLoading, form })}
                                </Col>
                            </Row>
                        </>
                    )
                }}
            </FormWithAction>
        </>
    )
}

export default BasePropertyForm
