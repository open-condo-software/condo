// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row } from 'antd'
import React from 'react'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { AddressSearchInput } from '@condo/domains/common/components/AddressSearchInput'
import { PropertyPanels } from '../panels'
import has from 'lodash/has'

interface IOrganization {
    id: string
}

interface IPropertyFormProps {
    organization: IOrganization
    initialValues?: IPropertyFormState
    action?: (...args) => void
    type: string
}

export const BasePropertyForm: React.FC<IPropertyFormProps> = (props) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const NameMsg = intl.formatMessage({ id: 'pages.condo.property.form.field.Name' })
    const { action, initialValues } = props

    return (
        <>
            <FormWithAction
                action={action}
                initialValues={initialValues}
                validateTrigger={['onBlur', 'onSubmit']}
                formValuesToMutationDataPreprocessor={ formData => {
                    try {
                        const newAddress = JSON.parse(formData['address'])
                        if (has(newAddress, 'address')) {
                            // address is created or changed
                            const addressMeta = { dv: 1, ...newAddress }
                            return { ...formData, addressMeta, address: addressMeta['address'] }
                        } else {
                            console.warn('JSON parse failed for ', formData['address'])
                        }
                    } catch (err) {
                        // address is the same
                        return formData
                    }
                }}
            >
                {({ handleSave, isLoading, form }) => {
                    return (
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
                                                <PropertyPanels mode='edit' map={map} updateMap={(map) => setFieldsValue({ map })} />
                                            )
                                        }
                                    }                                
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                {props.children({ handleSave, isLoading, form })}
                            </Col>
                        </Row>
                    )
                }}
            </FormWithAction>
        </>
    )
}
