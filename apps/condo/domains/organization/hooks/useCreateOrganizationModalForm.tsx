import { BaseQueryOptions } from '@apollo/client'
import { Form } from 'antd'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import getConfig from 'next/config'
import React, { useState, Dispatch, SetStateAction, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Space } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { SHOW_ORGANIZATION_TYPES } from '@condo/domains/common/constants/featureflags'
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
    onFinish?: () => void
}

const MODAL_VALIDATE_TRIGGERS = ['onBlur', 'onSubmit']
const FORM_ITEM_STYLES = { width: '60%' }
const ORGANIZATION_TYPE_FORM_ITEM_STYLES = { marginBottom: 8 }
const FETCH_OPTIONS: BaseQueryOptions = { fetchPolicy: 'network-only' }
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
const findPropByValue = (list, path, value) => list.find(item => get(item, path) === value)
const prepareFetchParams = userId => ({
    user: {
        id: userId,
    },
    isRejected: false,
    isBlocked: false,
})
const prepareFinishFetchParams = ({ id, userId }) => ({
    where: {
        organization: { id },
        user: {
            id: userId,
        },
    },
})
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

    const ValueIsTooShortMsg = intl.formatMessage({ id: 'valueIsTooShort' })
    const CreateOrganizationModalTitle = intl.formatMessage({ id: 'organizations.createOrganizationModalTitle' })
    const CreateOrganizationPlaceholder = intl.formatMessage({ id: 'organizations.createOrganizationPlaceholder' })
    const ManagingCompanyMessage = intl.formatMessage({ id: 'organizations.managingCompany' })
    const ServiceProviderMessage = intl.formatMessage({ id: 'organizations.serviceProvider' })

    const NameMsg = intl.formatMessage({ id: 'organizations.organizationName' })
    const InnMessage = intl.formatMessage({ id: 'organizations.tin' })
    const TinTooShortMsg = intl.formatMessage({ id: 'organizations.tin.tooShortMessage' })
    const TinValueIsInvalid = intl.formatMessage({ id: 'organizations.tin.invalidValue' })

    const ErrorToFormFieldMsgMapping = React.useMemo(
        () => prepareValidationErrorsMapping({ ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid }),
        [ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid]
    )

    const { useFlag } = useFeatureFlags()
    // TODO(DOMA-6567): Remove feature-flag and open service providers to everybody as soon as discoverServiceConsumers and tests arrives
    const isTypesVisible = useFlag(SHOW_ORGANIZATION_TYPES)

    const [isVisible, setIsVisible] = useState<boolean>(false)
    const { selectLink, organization } = useOrganization()
    const { user } = useAuth()
    const userId = get(user, 'id')
    const locale = get(organization, 'country', defaultLocale)

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

    const fetchParams = React.useMemo(() => ({ where: userId ? prepareFetchParams(userId) : {} }), [userId])
    const { refetch } = OrganizationEmployee.useObjects(fetchParams, FETCH_OPTIONS)

    const handleFinish = useCallback(async (createResult) => {
        const id = get(createResult, 'data.obj.id')
        const data = await refetch(prepareFinishFetchParams({ id, userId }))
        const userLinks = get(data, 'data.objs', [])

        if (id) {
            const newLink = findPropByValue(userLinks, ['organization', 'id'], id)

            if (newLink) {
                await selectLink(newLink)
                setIsVisible(false)
            }
        }

        if (isFunction(onFinish)) onFinish()

        return null
    }, [userId, selectLink, setIsVisible, refetch, onFinish])

    const handleMutationCompleted = React.useCallback(async (result) => {
        setIsVisible(false)
        await handleFinish(result)
    }, [handleFinish, setIsVisible])

    const handleCloseModal = React.useCallback(() => {
        setIsVisible(false)
    }, [setIsVisible])

    const ModalForm: React.FC = () => (
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
            {isTypesVisible && (
                <Form.Item name='type' style={ORGANIZATION_TYPE_FORM_ITEM_STYLES}>
                    <RadioGroup defaultValue={MANAGING_COMPANY_TYPE}>
                        <Space direction='vertical' size={16}>
                            <Radio value={MANAGING_COMPANY_TYPE} label={ManagingCompanyMessage}/>
                            <Radio value={SERVICE_PROVIDER_TYPE} label={ServiceProviderMessage}/>
                        </Space>
                    </RadioGroup>
                </Form.Item>
            )}
            <Form.Item name='name' label={NameMsg} rules={validators.name} validateFirst>
                <Input
                    placeholder={CreateOrganizationPlaceholder}
                />
            </Form.Item>
            <Form.Item name='tin' style={FORM_ITEM_STYLES} label={InnMessage} rules={validators.tin} validateFirst>
                <Input />
            </Form.Item>
        </BaseModalForm>
    )

    // TODO(DOMA-1588): Add memoization for hook members to prevent unnecessary rerenders
    return {
        isVisible,
        ModalForm,
        setIsVisible,
    }
}
