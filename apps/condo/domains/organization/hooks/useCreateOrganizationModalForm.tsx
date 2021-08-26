import { Form, Input, Typography } from 'antd'
import get from 'lodash/get'
import React, { useState, Dispatch, SetStateAction, useCallback } from 'react'
import { useIntl } from '@core/next/intl'
import { RUSSIA_COUNTRY } from '@condo/domains/common/constants/countries'
import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { REGISTER_NEW_ORGANIZATION_MUTATION } from '@condo/domains/organization/gql'
import { convertUIStateToGQLItem, OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { INN_LENGTH } from '@condo/domains/organization/constants/common'
import { EMPTY_NAME_ERROR, INN_TOO_SHORT_ERROR } from '@condo/domains/organization/constants/errors'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'

interface ICreateOrganizationModalFormResult {
    ModalForm: React.FC
    setIsVisible: Dispatch<SetStateAction<boolean>>
    isVisible: boolean
}

interface IUseCreateOrganizationModalFormProps {
    onFinish?: () => void
}

export const useCreateOrganizationModalForm = (props: IUseCreateOrganizationModalFormProps): ICreateOrganizationModalFormResult => {
    const intl = useIntl()

    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const CreateOrganizationModalMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationMessage' })

    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const InnMessage = intl.formatMessage({ id: 'pages.organizations.Inn' })
    const InnTooShortMsg = intl.formatMessage({ id: 'pages.organizations.inn.TooShortMessage' })
    const mutationExtraData = {
        country: RUSSIA_COUNTRY,
    }

    const [isVisible, setIsVisible] = useState<boolean>(false)
    const { selectLink } = useOrganization()
    const { user } = useAuth()

    const { fetchMore } = OrganizationEmployee.useObjects(
        { where: user ? { user: { id: user.id }, isRejected: false, isBlocked: false } : {} },
        { fetchPolicy: 'network-only' }
    )

    const onFinish = useCallback((createResult) => {
        const id = get(createResult, 'data.obj.id')

        fetchMore({
            where: { organization: { id }, user: { id: user.id } },
        }).then((data) => {
            const userLinks = get(data, 'data.objs', [])

            if (id) {
                const newLink = userLinks.find(link => link.organization.id === id)
                if (newLink) {
                    selectLink({ id: newLink.id })
                }
            }

            if (props.onFinish) {
                props.onFinish()
            }
        })

        return null
    }, [user])

    const ErrorToFormFieldMsgMapping = {
        [EMPTY_NAME_ERROR]: {
            name: 'name',
            errors: [ValueIsTooShortMsg],
        },
        [INN_TOO_SHORT_ERROR]: {
            name: 'inn',
            errors: [ValueIsTooShortMsg],
        },
    }

    const { requiredValidator, minLengthValidator, changeMessage } = useValidations()
    const validations = {
        name: [requiredValidator],
        inn: [requiredValidator, changeMessage(minLengthValidator(INN_LENGTH), InnTooShortMsg)],
    }

    const ModalForm: React.FC = () => (
        <BaseModalForm
            mutation={REGISTER_NEW_ORGANIZATION_MUTATION}
            mutationExtraData={mutationExtraData}
            formValuesToMutationDataPreprocessor={(values) => {
                const { name, inn } = values
                return convertUIStateToGQLItem({
                    name,
                    meta: { v: 1, inn },
                })
            }}
            onMutationCompleted={(result) => {
                if (onFinish) {
                    onFinish(result)
                }

                setIsVisible(false)
            }}
            visible={isVisible}
            cancelModal={() => setIsVisible(false)}
            ModalTitleMsg={CreateOrganizationModalTitle}
            ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
            showCancelButton={false}
            validateTrigger={['onBlur', 'onSubmit']}
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
                style={{ width: '50%' }}
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
