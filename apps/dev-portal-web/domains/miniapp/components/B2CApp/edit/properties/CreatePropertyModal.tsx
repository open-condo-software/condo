import { Form, notification, Row, Col } from 'antd'
import debounce from 'lodash/debounce'
import pick from 'lodash/pick'
import getConfig from 'next/config'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Modal, Select, Button, Alert } from '@open-condo/ui'
import type { SelectProps } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'

import type { AppEnvironment } from '@/gql'
import type { RowProps } from 'antd'

import { useCreateB2CAppPropertyMutation, AllB2CAppPropertiesDocument } from '@/gql'

const { publicRuntimeConfig: { addressServiceUrl } } = getConfig()

type CreatePropertyModalProps = {
    appId: string
    environment: AppEnvironment
    open: boolean
    closeFn: () => void
}

type Suggestion = {
    value: string
    type: 'building' | 'village' | null
}

type PropertyFormValues = {
    address: string
}

const DEBOUNCE_TIMEOUT = 500
const ROW_FORM_GUTTER: RowProps['gutter'] = [12, 12]
const FULL_COL_SPAN = 24
const ALLOWED_TYPES = ['building']
const ADDRESS_FORM_ERRORS_TO_FIELDS_MAP = {
    'b2c_app_property_unique_addressKey': 'address',
}

export const CreatePropertyModal: React.FC<CreatePropertyModalProps> = ({ open, closeFn, environment, appId }) => {
    const intl = useIntl()
    const ModalTitle = intl.formatMessage({ id: 'apps.b2c.sections.properties.newPropertyModal.title' })
    const AddressPlaceholder = intl.formatMessage({ id: 'apps.b2c.sections.properties.newPropertyModal.form.items.address.placeholder' })
    const ServerErrorMessage = intl.formatMessage({ id: 'global.errors.serverError.title' })
    const EmptySearchNoDataMessage = intl.formatMessage({ id: 'apps.b2c.sections.properties.newPropertyModal.form.items.address.noData.placeholder.emptySearch' })
    const NoDataMessage = intl.formatMessage({ id: 'apps.b2c.sections.properties.newPropertyModal.form.items.address.noData.placeholder.withSearch' })
    const SubmitButtonLabel = intl.formatMessage({ id: 'apps.b2c.sections.properties.newPropertyModal.form.actions.add' })
    const InfoMessage = intl.formatMessage({ id: 'apps.b2c.sections.properties.newPropertyModal.info.description' })
    const WrongAddressTypeError = intl.formatMessage({ id: 'apps.b2c.sections.properties.newPropertyModal.form.items.address.errors.invalidType.message' })
    const SuccessCreationMessage = intl.formatMessage({ id: 'apps.b2c.sections.properties.newPropertyModal.form.notifications.successCreation.title' })
    const AlreadyCreatedErrorMessage = intl.formatMessage({ id: 'apps.b2c.sections.properties.newPropertyModal.form.errors.alreadyCreated.message' })

    const [form] = Form.useForm()
    const [options, setOptions] = useState<SelectProps['options']>([])
    const [searchValue, setSearchValue] = useState('')

    const searchAddresses = useCallback(async (search: string) => {
        const url = new URL(`${addressServiceUrl}/suggest`)
        url.searchParams.set('s', search)
        url.searchParams.set('session', getClientSideSenderInfo().fingerprint)

        return fetch(url.toString(), {
            headers: { 'Accept': 'application/json' },
        })
            .then(response => response.json() as Promise<Array<Suggestion>>)
            .then(suggestions => ({ suggestions }))
    }, [])
    const handleSearch = useCallback(async (search: string) => {
        if (search) {
            try {
                const data = await searchAddresses(search)
                setOptions(data.suggestions.map(suggestion => ({ label: suggestion.value, value: JSON.stringify(pick(suggestion, 'value', 'type')) })))
            } catch (err) {
                if (err instanceof Error) {
                    notification.error({ message: ServerErrorMessage, description: err.message })
                }
                console.error(err)
            }
        }
    }, [searchAddresses, ServerErrorMessage])
    const debouncedSearch = useMemo(() => debounce(handleSearch, DEBOUNCE_TIMEOUT), [handleSearch])

    const handleSearchChange = useCallback(async (newSearch: string) => {
        setSearchValue(newSearch)
        await debouncedSearch(newSearch)
    }, [debouncedSearch])

    const handleChange = useCallback<Required<SelectProps>['onChange']>((newValue) => {
        if (newValue) {
            const suggestion: Suggestion = JSON.parse(newValue as string)
            setSearchValue(String(suggestion.value))
        }
    }, [])

    const { requiredFieldValidator } = useValidations()

    const onError = useMutationErrorHandler({
        form,
        typeToFieldMapping: ADDRESS_FORM_ERRORS_TO_FIELDS_MAP,
        constraintToMessageMapping: {
            'b2c_app_property_unique_addressKey': AlreadyCreatedErrorMessage,
        },
    })
    const onCompleted = useCallback(() => {
        notification.success({ message: SuccessCreationMessage })
        closeFn()
    }, [SuccessCreationMessage, closeFn])
    const [createB2CAppBuild] = useCreateB2CAppPropertyMutation({
        onCompleted,
        onError,
        refetchQueries: [AllB2CAppPropertiesDocument],
    })

    const handleFormSubmit = useCallback((values: PropertyFormValues) => {
        const selectedSuggestion: Suggestion = JSON.parse(values.address)
        if (!selectedSuggestion.type || !ALLOWED_TYPES.includes(selectedSuggestion.type)) {
            form.setFields([{
                name: 'address',
                errors: [WrongAddressTypeError],
            }])
        } else {
            createB2CAppBuild({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        environment,
                        address: selectedSuggestion.value,
                        app: { id: appId },
                    },
                },
            })
        }
    }, [form, WrongAddressTypeError, appId, createB2CAppBuild, environment])

    return (
        <Modal
            open={open}
            onCancel={closeFn}
            title={ModalTitle}
            footer={<Button type='primary' htmlType='submit' onClick={form.submit}>{SubmitButtonLabel}</Button>}
            scrollX={false}
        >
            <Form
                name='create-b2c-app-property'
                layout='vertical'
                form={form}
                onFinish={handleFormSubmit}
            >
                <Row gutter={ROW_FORM_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <Form.Item
                            name='address'
                            rules={[requiredFieldValidator]}
                        >
                            <Select
                                placeholder={AddressPlaceholder}
                                searchValue={searchValue}
                                showSearch
                                showArrow={false}
                                allowClear
                                onSearch={handleSearchChange}
                                onChange={handleChange}
                                options={options}
                                filterOption={false}
                                displayMode='fill-parent'
                                notFoundContentLabel={searchValue.length ? NoDataMessage : EmptySearchNoDataMessage}
                                ellipsis='start'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={FULL_COL_SPAN}>
                        <Alert type='info' description={InfoMessage} showIcon/>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}