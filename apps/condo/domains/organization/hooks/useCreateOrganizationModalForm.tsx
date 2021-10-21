import React, { useState, Dispatch, SetStateAction, useCallback } from 'react'
import { Form, Input, Typography } from 'antd'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'

import { BaseQueryOptions } from '@apollo/client'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'

import { RUSSIA_COUNTRY } from '@condo/domains/common/constants/countries'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'

import { INN_LENGTH } from '@condo/domains/organization/constants/common'
import { EMPTY_NAME_ERROR, INN_TOO_SHORT_ERROR, INN_VALUE_INVALID } from '@condo/domains/organization/constants/errors'
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
const FORM_ITEM_STYLES = { width: '50%' }
const FETCH_OPTIONS: BaseQueryOptions = { fetchPolicy: 'network-only' }
const MUTATION_EXTRA_DATA = { country: RUSSIA_COUNTRY }

const adaptOrganizationMeta = (values) => {
    const { name, inn } = values

    return convertUIStateToGQLItem({
        name,
        meta: { v: 1, inn },
    })
}

export const useCreateOrganizationModalForm = ({ onFinish }: IUseCreateOrganizationModalFormProps): ICreateOrganizationModalFormResult => {
    const intl = useIntl()

    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const CreateOrganizationModalMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationMessage' })

    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const InnMessage = intl.formatMessage({ id: 'pages.organizations.Tin' })
    const InnTooShortMsg = intl.formatMessage({ id: 'pages.organizations.tin.TooShortMessage' })
    const InnValueIsInvalid = intl.formatMessage({ id: 'pages.organizations.tin.InvalidValue' })

    const ErrorToFormFieldMsgMapping = React.useMemo(() => ({
        [EMPTY_NAME_ERROR]: {
            name: 'name',
            errors: [ValueIsTooShortMsg],
        },
        [INN_TOO_SHORT_ERROR]: {
            name: 'inn',
            errors: [InnTooShortMsg],
        },
        [INN_VALUE_INVALID]: {
            name: 'inn',
            errors: [InnValueIsInvalid],
        },
    }), [ValueIsTooShortMsg, InnTooShortMsg, InnValueIsInvalid])

    const [isVisible, setIsVisible] = useState<boolean>(false)
    const { selectLink } = useOrganization()
    const { user } = useAuth()
    const userId = get(user, 'id')

    const { fetchMore } = OrganizationEmployee.useObjects(
        { where: user ? { user: { id: userId }, isRejected: false, isBlocked: false } : {} },
        FETCH_OPTIONS
    )

    const handleFinish = useCallback((createResult) => {
        const id = get(createResult, 'data.obj.id')

        fetchMore({
            where: { organization: { id }, user: { id: userId } },
        }).then((data) => {
            const userLinks = get(data, 'data.objs', [])

            if (id) {
                const newLink = userLinks.find(link => get(link, ['organization', 'id']) === id)

                if (newLink) {
                    selectLink({ id: get(newLink, 'id') }).then(() => {
                        setIsVisible(false)
                    })
                }
            }

            if (isFunction(onFinish)) onFinish()
        })

        return null
    }, [user, selectLink, setIsVisible, fetchMore, onFinish])

    const { requiredValidator, minLengthValidator, changeMessage, tinValidator } = useValidations()

    const validations = {
        name: [requiredValidator],
        inn: [
            requiredValidator,
            changeMessage(minLengthValidator(INN_LENGTH), InnTooShortMsg),
            tinValidator(MUTATION_EXTRA_DATA.country),
        ],
    }

    const handleMutationCompleted = React.useCallback((result) => {
        if (isFunction(handleFinish)) handleFinish(result)

        setIsVisible(false)
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
            <Form.Item
                name='name'
                label={NameMsg}
                rules={validations.name}
            >
                <Input />
            </Form.Item>
            <Form.Item
                name='inn'
                style={FORM_ITEM_STYLES}
                label={InnMessage}
                rules={validations.inn}
            >
                <Input />
            </Form.Item>
        </BaseModalForm>
    )

    return {
        isVisible,
        ModalForm,
        setIsVisible,
    }
}
