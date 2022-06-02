import React, { useCallback } from 'react'
import { useIntl } from '@core/next/intl'
import { Col, Form, notification, Row, Typography, RowProps, FormInstance } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import isEmpty from 'lodash/isEmpty'
import dayjs from 'dayjs'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { AddressSuggestionsSearchInput } from '@condo/domains/property/components/AddressSuggestionsSearchInput'
import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
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
    children: (
        { handleSave, isLoading, form }: { handleSave: () => void, isLoading: boolean, form: FormInstance }
    ) => React.ReactElement
}

const INPUT_LAYOUT_PROPS = {
    style: {
        paddingBottom: '24px',
    },
}
const FORM_WITH_ACTION_STYLES = {
    width: '100%',
}
const PROPERTY_FULLSCREEN_ROW_GUTTER: RowProps['gutter']  = [0, 40]
const PROPERTY_ROW_GUTTER: RowProps['gutter'] = [50, 40]

const FORM_WITH_ACTION_VALIDATION_TRIGGERS = ['onBlur', 'onSubmit']


const BasePropertyForm: React.FC<IPropertyFormProps> = (props) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const AddressTitle = intl.formatMessage({ id: 'pages.condo.property.form.AddressTitle' })
    const NameMsg = intl.formatMessage({ id: 'pages.condo.property.form.field.Name' })
    const AreaTitle = intl.formatMessage({ id: 'pages.condo.property.form.AreaTitle' })
    const YearOfConstructionTitle = intl.formatMessage({ id: 'pages.condo.property.form.YearOfConstructionTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.AddressMetaParse' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.property.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.property.warning.modal.HelpMessage' })
    const AddressValidationErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.AddressValidationErrorMsg' })
    const SamePropertyErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SamePropertyErrorMsg' })
    const WrongYearErrorMsg = intl.formatMessage({ id: 'pages.condo.property.form.YearValidationError' })

    const { isSmall } = useLayoutContext()
    const { addressApi } = useAddressApi()
    const { action, initialValues } = props

    const [addressValidatorError, setAddressValidatorError] = useState<string | null>(null)
    const formValuesToMutationDataPreprocessor = useCallback((formData, _, form) => {
        const isAddressFieldTouched = form.isFieldsTouched(['address'])
        const yearOfConstruction = formData.yearOfConstruction && !isEmpty(formData.yearOfConstruction)
            ? dayjs().year(formData.yearOfConstruction).format('YYYY-MM-DD')
            : null
        // TODO (DOMA-1725) Replace it with better parsing
        const area = formData.area ? formData.area.replace(',', '.') : null

        if (isAddressFieldTouched) {
            try {
                const addressMeta = addressApi.getAddressMeta(formData.address)
                return { ...formData, addressMeta: { dv: 1, ...addressMeta }, yearOfConstruction, area }
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
        return { ...cleanedFormData, yearOfConstruction, area }
    }, [initialValues])
    const { requiredValidator, numberValidator, maxLengthValidator } = useValidations()
    const addressValidator = {
        validator () {
            if (!addressValidatorError) {
                return Promise.resolve()
            }
            return Promise.reject(addressValidatorError)
        },
    }
    const yearOfConstructionValidator = {
        validator (_, val) {
            if (val === null) {
                return Promise.resolve()
            }
            const receivedDate = dayjs().year(val)
            if (val.length === 0 || val.length === 4 && receivedDate.isValid() && receivedDate.isBefore(dayjs().add(1, 'day'))) {
                return Promise.resolve()
            }
            return Promise.reject(WrongYearErrorMsg)
        },
    }
    const validations = {
        address: [requiredValidator, addressValidator],
        area: [numberValidator, maxLengthValidator(12)],
        yearOfConstruction: [yearOfConstructionValidator],
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
                validateTrigger={FORM_WITH_ACTION_VALIDATION_TRIGGERS}
                formValuesToMutationDataPreprocessor={formValuesToMutationDataPreprocessor}
                ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
                style={FORM_WITH_ACTION_STYLES}
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
                            <Row gutter={PROPERTY_FULLSCREEN_ROW_GUTTER}>
                                <Col xs={24} lg={11}>
                                    <Form.Item
                                        name="address"
                                        label={AddressLabel}
                                        rules={validations.address}
                                        {...INPUT_LAYOUT_PROPS}
                                    >
                                        <AddressSuggestionsSearchInput
                                            placeholder={AddressTitle}
                                            onSelect={(_, option) => {
                                                const address = JSON.parse(option.key as string) as AddressMetaField
                                                if (!validHouseTypes.includes(address.data.house_type_full)) {
                                                    setAddressValidatorError(AddressValidationErrorMsg)
                                                }
                                                else if (AddressValidationErrorMsg) setAddressValidatorError(null)
                                            }} />
                                    </Form.Item>
                                    <Form.Item
                                        name="map"
                                        hidden
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={PROPERTY_FULLSCREEN_ROW_GUTTER}>
                                <Col xs={24} lg={11}>
                                    <Form.Item
                                        name="name"
                                        label={NameMsg}
                                        {...INPUT_LAYOUT_PROPS}
                                    >
                                        <Input allowClear={true}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={PROPERTY_ROW_GUTTER}>
                                <Col span={isSmall ? 12 : 4} >
                                    <Form.Item
                                        name="area"
                                        label={AreaTitle}
                                        rules={validations.area}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={isSmall ? 12 : 4} >
                                    <Form.Item
                                        name="yearOfConstruction"
                                        label={YearOfConstructionTitle}
                                        rules={validations.yearOfConstruction}
                                    ><Input /></Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={PROPERTY_FULLSCREEN_ROW_GUTTER}>
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
