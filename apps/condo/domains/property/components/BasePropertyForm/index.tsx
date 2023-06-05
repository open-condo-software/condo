import { Col, Form, FormInstance, notification, Row, RowProps } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useState } from 'react'

import { omitRecursively } from '@open-condo/keystone/fields/Json/utils/cleaner'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import Input from '@condo/domains/common/components/antd/Input'
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

const INPUT_LAYOUT_PROPS = {
    style: {
        paddingBottom: '24px',
    },
}
const FORM_WITH_ACTION_STYLES = {
    width: '100%',
}
const PROPERTY_FULLSCREEN_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const PROPERTY_ROW_GUTTER: RowProps['gutter'] = [40, 40]

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

    const { breakpoints } = useLayoutContext()
    const { addressApi } = useAddressApi()
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
        setAddressValidatorError(address.isHouse ? null : AddressValidationErrorMsg)
    }, [AddressValidationErrorMsg])

    const validations = {
        address: [requiredValidator, addressValidator],
        area: [numberValidator, maxLengthValidator(12)],
        yearOfConstruction: [yearOfConstructionValidator],
    }

    return (
        <>
            <FormWithAction
                action={action}
                initialValues={initialValues}
                validateTrigger={FORM_WITH_ACTION_VALIDATION_TRIGGERS}
                formValuesToMutationDataPreprocessor={formValuesToMutationDataPreprocessor}
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
                                        name='address'
                                        label={AddressLabel}
                                        rules={validations.address}
                                        {...INPUT_LAYOUT_PROPS}
                                    >
                                        <AddressSuggestionsSearchInput
                                            placeholder={AddressTitle}
                                            addressValidatorError={addressValidatorError}
                                            setAddressValidatorError={setAddressValidatorError}
                                            onSelect={onSuggestionSelected}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name='map'
                                        hidden
                                    >
                                        <Input/>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={PROPERTY_FULLSCREEN_ROW_GUTTER}>
                                <Col xs={24} lg={11}>
                                    <Form.Item
                                        name='name'
                                        label={NameMsg}
                                        {...INPUT_LAYOUT_PROPS}
                                    >
                                        <Input allowClear={true}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={PROPERTY_ROW_GUTTER}>
                                <Col span={!breakpoints.TABLET_LARGE ? 12 : 4}>
                                    <Form.Item
                                        name='area'
                                        label={AreaTitle}
                                        rules={validations.area}
                                    >
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={!breakpoints.TABLET_LARGE ? 12 : 4}>
                                    <Form.Item
                                        name='yearOfConstruction'
                                        label={YearOfConstructionTitle}
                                        rules={validations.yearOfConstruction}
                                    >
                                        <Input/>
                                    </Form.Item>
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
