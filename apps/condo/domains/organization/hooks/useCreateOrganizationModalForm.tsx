import { Form, Input, Typography } from 'antd'
import { useState, Dispatch, SetStateAction } from 'react'
import { useIntl } from '@core/next/intl'
import { RUSSIA_COUNTRY } from '@condo/domains/common/constants/countries'
import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import {
    REGISTER_NEW_ORGANIZATION_MUTATION,
} from '@condo/domains/organization/gql'
import {
    convertUIStateToGQLItem,
} from '@condo/domains/organization/utils/clientSchema'
import { INN_LENGTH } from '@condo/domains/organization/constants'

interface ICreateOrganizationModalFormArguments {
    onFinish: (newOrganization) => void
}

interface ICreateOrganizationModalFormResult {
    ModalForm: React.FC
    setVisible: Dispatch<SetStateAction<boolean>>
}

export const useCreateOrganizationModalForm = ({ onFinish }: ICreateOrganizationModalFormArguments): ICreateOrganizationModalFormResult => {
    const intl = useIntl()
    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const CreateOrganizationModalMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationMessage' })

    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const InnMessage = intl.formatMessage({ id: 'pages.organizations.Inn' })
    const InnTooShortMsg = intl.formatMessage({ id: 'pages.organizations.inn.TooShortMessage' })
    const mutationExtraData = {
        country: RUSSIA_COUNTRY,
    }
    const [visible, setVisible] = useState<boolean>(false)
    const ErrorToFormFieldMsgMapping = {
        '[name.is.too.short]': {
            name: 'name',
            errors: [ValueIsTooShortMsg],
        },
        '[inn.is.too.short]': {
            name: 'inn',
            errors: [ValueIsTooShortMsg],
        },
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
                onFinish(result)
                setVisible(false)
            }}
            visible={visible}
            cancelModal={() => setVisible(false)}
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
                rules={[{ required: true, message: FieldIsRequiredMsg }]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                name='inn'
                style={{ width: '50%' }}
                label={InnMessage}
                rules={[
                    { required: true, message: FieldIsRequiredMsg },
                    {
                        min: INN_LENGTH,
                        message: InnTooShortMsg,
                    },
                ]}
            >
                <Input />
            </Form.Item>
        </BaseModalForm>
    )

    return {
        ModalForm,
        setVisible,
    }
}
