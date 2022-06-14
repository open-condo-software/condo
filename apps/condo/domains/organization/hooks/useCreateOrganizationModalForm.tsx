import React, { useState, Dispatch, SetStateAction, useCallback } from 'react'
import { Form, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'

import { BaseQueryOptions } from '@apollo/client'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'

import { RUSSIA_COUNTRY } from '@condo/domains/common/constants/countries'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'

import { TIN_LENGTH } from '@condo/domains/organization/constants/common'
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
const FETCH_OPTIONS: BaseQueryOptions = { fetchPolicy: 'network-only' }
const MUTATION_EXTRA_DATA = { country: RUSSIA_COUNTRY }

const adaptOrganizationMeta = (values) => {
    const { name, tin } = values

    return convertUIStateToGQLItem({
        name,
        tin: tin.trim(),
        meta: { dv: 1 },
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
const prepareValidators = ({ requiredValidator, changeMessage, minLengthValidator, TinTooShortMsg, tinValidator }) => ({
    name: [requiredValidator],
    tin: [
        requiredValidator,
        changeMessage(minLengthValidator(TIN_LENGTH), TinTooShortMsg),
        tinValidator(MUTATION_EXTRA_DATA.country),
    ],
})

export const useCreateOrganizationModalForm = ({ onFinish }: IUseCreateOrganizationModalFormProps): ICreateOrganizationModalFormResult => {
    const intl = useIntl()

    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const CreateOrganizationModalMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationMessage' })
    const CreateOrganizationPlaceholder = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationPlaceholder' })

    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const InnMessage = intl.formatMessage({ id: 'pages.organizations.tin' })
    const TinTooShortMsg = intl.formatMessage({ id: 'pages.organizations.tin.TooShortMessage' })
    const TinValueIsInvalid = intl.formatMessage({ id: 'pages.organizations.tin.InvalidValue' })

    const ErrorToFormFieldMsgMapping = React.useMemo(
        () => prepareValidationErrorsMapping({ ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid }),
        [ValueIsTooShortMsg, TinTooShortMsg, TinValueIsInvalid]
    )

    const [isVisible, setIsVisible] = useState<boolean>(false)
    const { selectLink } = useOrganization()
    const { user } = useAuth()
    const userId = get(user, 'id')

    const { requiredValidator, minLengthValidator, changeMessage, tinValidator } = useValidations()
    const validators = React.useMemo(
        () => prepareValidators({ requiredValidator, changeMessage, minLengthValidator, TinTooShortMsg, tinValidator }),
        [requiredValidator, changeMessage, minLengthValidator, TinTooShortMsg, tinValidator]
    )

    const fetchParams = React.useMemo(() => ({ where: userId ? prepareFetchParams(userId) : {} }), [userId])
    const { fetchMore } = OrganizationEmployee.useObjects(fetchParams, FETCH_OPTIONS)

    const handleFinish = useCallback(async (createResult) => {
        const id = get(createResult, 'data.obj.id')
        const data = await fetchMore(prepareFinishFetchParams({ id, userId }))
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
    }, [userId, selectLink, setIsVisible, fetchMore, onFinish])

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
            <Typography.Paragraph>
                {CreateOrganizationModalMsg}
            </Typography.Paragraph>

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
