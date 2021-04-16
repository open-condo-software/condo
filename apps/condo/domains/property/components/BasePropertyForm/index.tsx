// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row } from 'antd'
import React from 'react'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { AddressSearchInput } from '@condo/domains/common/components/AddressSearchInput'
import { PropertyPanels } from '../panels'

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
                        // address is created or changed
                        const addressMeta = { dv: 1, ...JSON.parse(formData['address']) } 
                        return { ...formData, addressMeta, address: addressMeta['address'] }
                    } catch (err) {
                        // address is the same
                        return formData
                    }
                }}
            >
                {({ handleSave, isLoading, form }) => (
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
                        <Col span={24}>
                            <PropertyPanels mode='edit'></PropertyPanels>
                        </Col>
                        <Col span={24}>
                            {props.children({ handleSave, isLoading, form })}
                        </Col>
                    </Row>
                )}
            </FormWithAction>
        </>
    )
}
