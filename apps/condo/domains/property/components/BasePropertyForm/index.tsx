import { Col, Form, FormInstance, notification, Row } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useMemo, useState } from 'react'

import { omitRecursively } from '@open-condo/keystone/fields/Json/utils/cleaner'
import { useIntl } from '@open-condo/next/intl'
import { Tour, Input, Typography } from '@open-condo/ui'

import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import Prompt from '@condo/domains/common/components/Prompt'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { AddressSuggestionsSearchInput } from '@condo/domains/property/components/AddressSuggestionsSearchInput'
import { TSelectedAddressSuggestion } from '@condo/domains/property/components/BasePropertyForm/types'
import { usePropertyValidations } from '@condo/domains/property/hooks/usePropertyValidations'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'


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
        { handleSave, isLoading, form }: { handleSave: () => void, isLoading: boolean, form: FormInstance },
    ) => React.ReactElement
}

const FORM_WITH_ACTION_VALIDATION_TRIGGERS = ['onBlur', 'onSubmit']
const SMALL_INPUT_WRAPPER_COL = {
    lg: 3,
    md: 5,
    xs: 24,
}

const BasePropertyForm: React.FC<IPropertyFormProps> = (props) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const AddressTitle = intl.formatMessage({ id: 'pages.condo.property.form.AddressTitle' })
    const NamePlaceholder = intl.formatMessage({ id: 'pages.condo.property.form.NamePlaceholder' })
    const AreaPlaceholder = intl.formatMessage({ id: 'pages.condo.property.form.AreaPlaceholder' })
    const AreaSuffix = intl.formatMessage({ id: 'pages.condo.property.form.AreaSuffix' })
    const YearPlaceholder = intl.formatMessage({ id: 'pages.condo.property.form.YearPlaceholder' })
    const NameMsg = intl.formatMessage({ id: 'pages.condo.property.form.field.Name' })
    const AreaTitle = intl.formatMessage({ id: 'pages.condo.property.form.AreaTitle' })
    const YearOfConstructionTitle = intl.formatMessage({ id: 'pages.condo.property.form.YearOfConstructionTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.AddressMetaParse' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.property.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.property.warning.modal.HelpMessage' })
    const AddressValidationErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.AddressValidationErrorMsg' })

    const { breakpoints } = useLayoutContext()
    const { addressApi } = useAddressApi()
    const { setCurrentStep } = Tour.useTourContext()
    const { action, initialValues, organization, address } = props

    const organizationId = get(organization, 'id')
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
                const cachedAddress = addressApi.getRawAddress(formData.address)
                const { value: address } = JSON.parse(cachedAddress)
                return { ...formData, address, yearOfConstruction, area }
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
    const { addressValidator, yearOfConstructionValidator } = usePropertyValidations({
        organizationId, addressValidatorError, address,
    })

    const onSuggestionSelected = useCallback((_, option) => {
        const address = JSON.parse(option.key as string) as TSelectedAddressSuggestion
        const isHouse = address.isHouse
        setAddressValidatorError(address.isHouse ? null : AddressValidationErrorMsg)
        setCurrentStep(() => isHouse ? 1 : 0)
    }, [AddressValidationErrorMsg, setCurrentStep])

    const validations = {
        address: [requiredValidator, addressValidator],
        area: [numberValidator, maxLengthValidator(12)],
        yearOfConstruction: [yearOfConstructionValidator],
    }

    const formLayout = useMemo(() => ({
        labelCol: {
            lg: 6,
            md: 10,
            xs: 24,
        },
        wrapperCol: {
            lg: 7,
            md: 10,
            xs: 24,
        },
        layout: breakpoints.TABLET_LARGE ? 'horizontal' : 'vertical',
        labelAlign: 'left',
    }), [breakpoints])

    return (
        <>
            <FormWithAction
                action={action}
                initialValues={initialValues}
                validateTrigger={FORM_WITH_ACTION_VALIDATION_TRIGGERS}
                formValuesToMutationDataPreprocessor={formValuesToMutationDataPreprocessor}
                {...formLayout}
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
                                <Col span={24}>
                                    <Row gutter={[0, 16]}>
                                        <Col span={24}>
                                            <Form.Item
                                                name='address'
                                                label={AddressLabel}
                                                rules={validations.address}
                                            >
                                                <AddressSuggestionsSearchInput
                                                    placeholder={AddressTitle}
                                                    addressValidatorError={addressValidatorError}
                                                    setAddressValidatorError={setAddressValidatorError}
                                                    onSelect={onSuggestionSelected}
                                                    onChange={() => setCurrentStep(0)}
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                name='map'
                                                hidden
                                            >
                                                <Input/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                name='name'
                                                label={NameMsg}
                                            >
                                                <Input
                                                    allowClear={true}
                                                    placeholder={NamePlaceholder}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                name='area'
                                                label={AreaTitle}
                                                rules={validations.area}
                                                wrapperCol={SMALL_INPUT_WRAPPER_COL}
                                            >
                                                <Input
                                                    placeholder={AreaPlaceholder}
                                                    suffix={AreaSuffix}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                name='yearOfConstruction'
                                                label={YearOfConstructionTitle}
                                                rules={validations.yearOfConstruction}
                                                wrapperCol={SMALL_INPUT_WRAPPER_COL}
                                            >
                                                <Input placeholder={YearPlaceholder} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
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
