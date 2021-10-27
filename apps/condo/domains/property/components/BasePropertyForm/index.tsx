// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import { Col, Form, Input, notification, Row, Typography } from 'antd'
import React, { useCallback } from 'react'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { AddressSuggestionsSearchInput } from '@condo/domains/property/components/AddressSuggestionsSearchInput'
import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { useLayoutContext } from '../../../common/components/LayoutContext'
import { PropertyPanels } from '../panels'
import Prompt from '@condo/domains/common/components/Prompt'
import { AddressMetaField } from '@app/condo/schema'
import { useState } from 'react'
import { validHouseTypes } from '@condo/domains/property/constants/property'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { PROPERTY_WITH_SAME_ADDRESS_EXIST } from '../../constants/errors'
import { omitRecursively } from '@core/keystone/fields/Json/utils/cleaner'

interface IOrganization {
    id: string
}

interface IPropertyFormProps {
    organization: IOrganization
    initialValues?: IPropertyFormState
    action?: (...args) => void
    type: string
    address?: string
}

const BasePropertyForm: React.FC<IPropertyFormProps> = (props) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const NameMsg = intl.formatMessage({ id: 'pages.condo.property.form.field.Name' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.AddressMetaParse' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.property.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.property.warning.modal.HelpMessage' })
    const AddressValidationErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.AddressValidationErrorMsg' })
    const SameUnitNamesErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })
    const SamePropertyErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SamePropertyErrorMsg' })

    const { addressApi } = useAddressApi()

    const { action, initialValues } = props

    const { isSmall } = useLayoutContext()
    const [mapValidationError, setMapValidationError] = useState<string | null>(null)
    const [addressValidatorError, setAddressValidatorError] = useState<string | null>(null)
    const formValuesToMutationDataPreprocessor = useCallback((formData, _, form) => {
        const isAddressFieldTouched = form.isFieldsTouched(['address'])

        if (isAddressFieldTouched) {
            try {
                const addressMeta = addressApi.getAddressMeta(formData.address)

                return { ...formData, addressMeta: { dv: 1, ...addressMeta } }
            } catch (e) {
                notification.error({
                    message: ServerErrorMsg,
                    description: AddressMetaError,
                })

                console.error(e)
                return
            }
        }

        // Requested fields of Property of JSON-type, mapped to GraphQL, containing `__typename` field in each typed node.
        // It seems, like we cannot control it.
        // So, these fields should be cleaned, because it will result to incorrect input into update-mutation
        const cleanedFormData = omitRecursively(formData, '__typename')
        return cleanedFormData
    }, [initialValues])

    const { requiredValidator } = useValidations()
    const addressValidator = {
        validator () {
            if (!addressValidatorError) {
                return Promise.resolve()
            }
            return Promise.reject(addressValidatorError)
        },
    }
    const validations = {
        address: [requiredValidator, addressValidator],
    }

    const ErrorToFormFieldMsgMapping = {
        [PROPERTY_WITH_SAME_ADDRESS_EXIST]: {
            name: 'address',
            errors: [SamePropertyErrorMsg],
        },
    }

    return (
        <>
            <FormWithAction
                action={action}
                initialValues={initialValues}
                validateTrigger={['onBlur', 'onSubmit']}
                formValuesToMutationDataPreprocessor={formValuesToMutationDataPreprocessor}
                ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
                style={{ width: '100%' }}
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
                                <Col xs={24} lg={7}>
                                    <Form.Item
                                        name="address"
                                        label={AddressLabel}
                                        rules={validations.address}
                                    >
                                        <AddressSuggestionsSearchInput
                                            onSelect={(_, option) => {
                                                const address = JSON.parse(option.key) as AddressMetaField
                                                if (!validHouseTypes.includes(address.data.house_type_full)) {
                                                    setAddressValidatorError(AddressValidationErrorMsg)
                                                }
                                                else if (AddressValidationErrorMsg) setAddressValidatorError(null)
                                            }} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} lg={7} offset={isSmall ? 0 : 1}>
                                    <Form.Item
                                        name="name"
                                        label={NameMsg}
                                    >
                                        <Input allowClear={true}/>
                                    </Form.Item>
                                </Col>
                                <Col span={24} >
                                    <Form.Item
                                        hidden
                                        name='map'
                                        rules={[
                                            {
                                                validator (rule, value) {
                                                    const unitLabels = value?.sections
                                                        ?.map((section) => section.floors
                                                            ?.map(floor => floor.units
                                                                ?.map(unit => unit.label)
                                                            )
                                                        )
                                                        .flat(2)

                                                    if (unitLabels && unitLabels.length !== new Set(unitLabels).size) {
                                                        setMapValidationError(SameUnitNamesErrorMsg)
                                                        return Promise.reject()
                                                    }

                                                    setMapValidationError(null)
                                                    return Promise.resolve()
                                                },
                                            },
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        shouldUpdate={true}
                                        onBlur={() => setMapValidationError(null)}
                                    >
                                        {
                                            ({ getFieldsValue, setFieldsValue }) => {
                                                const { map } = getFieldsValue(['map'])
                                                return (
                                                    <PropertyPanels
                                                        mapValidationError={mapValidationError}
                                                        mode='edit'
                                                        map={map}
                                                        handleSave={handleSave}
                                                        updateMap={map => setFieldsValue({ map })}
                                                        address={props.address}
                                                    />
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
