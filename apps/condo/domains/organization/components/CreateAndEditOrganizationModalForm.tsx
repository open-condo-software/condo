import { Form, Input } from 'antd'
import { useIntl } from '@core/next/intl'
import { RUSSIA_COUNTRY } from '@condo/domains/common/constants/countries'
import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import {
    REGISTER_NEW_ORGANIZATION_MUTATION,
    UPDATE_ORGANIZATION_BY_ID_MUTATION,
} from '@condo/domains/organization/gql'
import {
    convertGQLItemToUIState,
    convertUIStateToGQLItem,
} from '@condo/domains/organization/utils/clientSchema'

interface ICreateOrganizationModalFormProps {
    visible: boolean
    onFinish: () => null
}

export const CreateAndEditOrganizationModalForm: React.FC<ICreateOrganizationModalFormProps> = ({ visible, onFinish }) => {
    const intl = useIntl()
    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitleMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const NameMsg = intl.formatMessage({ id: 'pages.organizations.OrganizationName' })
    const mutationExtraData = {
        country: RUSSIA_COUNTRY,
        meta: { v: 1, inn: 'fake!' },
    }
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

    return <BaseModalForm
        mutation={REGISTER_NEW_ORGANIZATION_MUTATION}
        mutationExtraVariables={{}}
        mutationExtraData={mutationExtraData}
        formValuesToMutationDataPreprocessor={convertUIStateToGQLItem}
        formInitialValues={{}}
        visible={visible}
        cancelModal={() => null}
        onMutationCompleted={onFinish}
        ModalTitleMsg={CreateOrganizationModalTitleMsg}
        ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
    >
        <Form.Item
            name="name"
            label={NameMsg}
            rules={[{ required: true, message: FieldIsRequiredMsg }]}
        >
            <Input/>
        </Form.Item>
        <Form.Item
            name="inn"
            label={NameMsg}
            rules={[{ required: true, message: FieldIsRequiredMsg }]}
        >
            <Input/>
        </Form.Item>
    </BaseModalForm>
}
