import { useApolloClient } from '@apollo/client'
import { GetActualOrganizationEmployeesDocument } from '@app/condo/gql'
import { Organization } from '@app/condo/schema'
import { Form } from 'antd'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import getConfig from 'next/config'
import React, { useState, Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Space } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'
import { EMPTY_NAME_ERROR, TIN_TOO_SHORT_ERROR, TIN_VALUE_INVALID } from '@condo/domains/organization/constants/errors'
import { REGISTER_NEW_ORGANIZATION_MUTATION } from '@condo/domains/organization/gql'
import { convertUIStateToGQLItem, OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'


interface ICreateOrganizationModalFormResult {
    ModalForm: React.FC
    setIsVisible: Dispatch<SetStateAction<boolean>>
    isVisible: boolean
}

interface IUseCreateOrganizationModalFormProps {
    onFinish?: (organization: Organization) => void
}

const MODAL_VALIDATE_TRIGGERS = ['onBlur', 'onSubmit']
const FORM_ITEM_STYLES = { width: '60%' }
const ORGANIZATION_TYPE_FORM_ITEM_STYLES = { marginBottom: 8 }
const { publicRuntimeConfig: { defaultLocale } } = getConfig()
const MUTATION_EXTRA_DATA = { country: defaultLocale }

const adaptOrganizationMeta = (values) => {
    const { name, tin, type } = values

    return convertUIStateToGQLItem({
        name,
        tin: tin.trim(),
        meta: { dv: 1 },
        type: type || MANAGING_COMPANY_TYPE,
    })
}
const prepareValidationErrorsMapping = ({ ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid }) => ({
    [EMPTY_NAME_ERROR]: {
        name: 'name',
        errors: [ValueIsTooShortMsg],
    },
    [TIN_TOO_SHORT_ERROR]: {
        name: 'tin',
        errors: [TinTooShortMsg],
    },
    [TIN_VALUE_INVALID]: {
        name: 'tin',
        errors: [TinValueIsInvalid],
    },
})
const prepareValidators = ({ requiredValidator, tinValidator, trimValidator, locale }) => ({
    name: [requiredValidator, trimValidator],
    tin: [
        requiredValidator,
        tinValidator(locale),
    ],
})

export const useCreateOrganizationModalForm = ({ onFinish }: IUseCreateOrganizationModalFormProps): ICreateOrganizationModalFormResult => {
    const intl = useIntl()

    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const CreateOrganizationPlaceholder = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationPlaceholder' })
    const ManagingCompanyMessage = intl.formatMessage({ id: 'pages.organizations.managingCompany' })
    const ServiceProviderMessage = intl.formatMessage({ id: 'pages.organizations.serviceProvider' })

    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const InnMessage = intl.formatMessage({ id: 'pages.organizations.tin' })
    const TinTooShortMsg = intl.formatMessage({ id: 'pages.organizations.tin.TooShortMessage' })
    const TinValueIsInvalid = intl.formatMessage({ id: 'pages.organizations.tin.InvalidValue' })

    const ErrorToFormFieldMsgMapping = React.useMemo(
        () => prepareValidationErrorsMapping({ ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid }),
        [ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid]
    )

    const [isVisible, setIsVisible] = useState<boolean>(false)
    const { selectEmployee, organization } = useOrganization()
    const { user } = useAuth()
    const userId = get(user, 'id')
    const locale = get(organization, 'country', defaultLocale)
    // TODO(pahaz): DOMA-10729 use this locale for country and MUTATION_EXTRA_DATA

    const { requiredValidator, tinValidator, trimValidator } = useValidations()
    const validators = React.useMemo(
        () => prepareValidators({
            requiredValidator,
            tinValidator,
            trimValidator,
            locale,
        }),
        [requiredValidator, tinValidator, trimValidator, locale],
    )

    const { refetch } = OrganizationEmployee.useObjects({}, { skip: true })

    const client = useApolloClient()

    const handleFinish = useCallback(async (createResult) => {
        const id = get(createResult, 'data.obj.id')
        const data = await refetch({
            where: {
                organization: { id },
                user: {
                    id: userId,
                },
                isRejected: false,
                isBlocked: false,
                isAccepted: true,
            },
            first: 1,
        })
        const employee = get(data, ['data', 'objs', 0]) || null

        if (id && employee?.id) {
            await client.refetchQueries({
                include: [GetActualOrganizationEmployeesDocument],
            })

            await selectEmployee(employee?.id)
            setIsVisible(false)
        }

        if (isFunction(onFinish)) onFinish(get(createResult, 'data.obj'))

        return null
    }, [refetch, userId, onFinish, client, selectEmployee])

    const handleMutationCompleted = React.useCallback(async (result) => {
        setIsVisible(false)
        await handleFinish(result)
    }, [handleFinish, setIsVisible])

    const handleCloseModal = React.useCallback(() => {
        setIsVisible(false)
    }, [setIsVisible])

    const ModalForm: React.FC = useCallback(() => (
        <BaseModalForm
            mutation={REGISTER_NEW_ORGANIZATION_MUTATION}
            mutationExtraData={MUTATION_EXTRA_DATA}
            formValuesToMutationDataPreprocessor={adaptOrganizationMeta}
            onMutationCompleted={handleMutationCompleted}
            visible={isVisible}
            cancelModal={handleCloseModal}
            ModalTitleMsg={CreateOrganizationModalTitle}
            ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
            showCancelButton={false}
            validateTrigger={MODAL_VALIDATE_TRIGGERS}
        >
            <Form.Item name='type' style={ORGANIZATION_TYPE_FORM_ITEM_STYLES}>
                <RadioGroup defaultValue={MANAGING_COMPANY_TYPE}>
                    <Space direction='vertical' size={16}>
                        <Radio value={MANAGING_COMPANY_TYPE} label={ManagingCompanyMessage}/>
                        <Radio value={SERVICE_PROVIDER_TYPE} label={ServiceProviderMessage}/>
                    </Space>
                </RadioGroup>
            </Form.Item>
            <Form.Item name='name' label={NameMsg} rules={validators.name} validateFirst>
                <Input
                    placeholder={CreateOrganizationPlaceholder}
                />
            </Form.Item>
            <Form.Item name='tin' style={FORM_ITEM_STYLES} label={InnMessage} rules={validators.tin} validateFirst>
                <Input />
            </Form.Item>
        </BaseModalForm>
    ), [CreateOrganizationModalTitle, CreateOrganizationPlaceholder, ErrorToFormFieldMsgMapping, InnMessage, ManagingCompanyMessage, NameMsg, ServiceProviderMessage, handleCloseModal, handleMutationCompleted, isVisible, validators.name, validators.tin])

    return useMemo(() => ({
        isVisible,
        ModalForm,
        setIsVisible,
    }), [ModalForm, isVisible])
}
