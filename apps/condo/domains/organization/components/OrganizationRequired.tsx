// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { css } from '@emotion/core'
import { Typography } from 'antd'
import { useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import qs from 'qs'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { RUSSIA_COUNTRY } from '@condo/domains/common/constants/countries'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { isFunction } from '@condo/domains/common/utils/ecmascript.utils'
import { Loader } from '@condo/domains/common/components/Loader'
import { AuthRequired } from '../../common/components/containers/AuthRequired'
import { isFunction } from '../../common/utils/ecmascript.utils'
import { Avatar, Button, Form, Input, notification, Radio, Tag } from 'antd'
import {
    BaseModalForm,
} from '@condo/domains/common/components/containers/FormList'
import {
    ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION,
    REGISTER_NEW_ORGANIZATION_MUTATION,
    UPDATE_ORGANIZATION_BY_ID_MUTATION,
} from '@condo/domains/organization/gql'
import {
    convertGQLItemToUIState,
    convertUIStateToGQLItem,
    OrganizationEmployee,
} from '@condo/domains/organization/utils/clientSchema'
import { useState } from 'react'

const DEFAULT_ORGANIZATION_AVATAR_URL = 'https://www.pngitem.com/pimgs/m/226-2261747_company-name-icon-png-transparent-png.png'

function CreateOrganizationModalForm ({ visible, onFinish }) {
    const intl = useIntl()
    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitleMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const [showModal, setShowModal] = useState(visible)
    // const NameMsg = intl.formatMessage({ id: 'Name' })
    const DescriptionMsg = intl.formatMessage({ id: 'Description' })
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
    }
    return <BaseModalForm
        /* NOTE: we need to recreate form if editableItem changed because the form initialValues are cached */
        mutation={REGISTER_NEW_ORGANIZATION_MUTATION}
        mutationExtraData={mutationExtraData}
        formValuesToMutationDataPreprocessor={convertUIStateToGQLItem}
        visible={showModal}
        onMutationCompleted={onFinish}
        ModalTitleMsg={CreateOrganizationModalTitleMsg}
        ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
        cancelModal={() => setShowModal(false)}
    >
        <Form.Item
            name="name"
            label={NameMsg}
            rules={[{ required: true, message: FieldIsRequiredMsg }]}
        >
            <Input/>
        </Form.Item>
        <Form.Item
            name="description"
            label={DescriptionMsg}
            rules={[{ required: true, message: FieldIsRequiredMsg }]}
        >
            <Input.TextArea/>
        </Form.Item>
    </BaseModalForm>
}

function OrganizationRequiredAfterAuthRequired ({ children, withEmployeeRestrictions }) {
    const intl = useIntl()
    const EmployeeRestrictedTitle = intl.formatMessage({ id: 'employee.emptyList.title' })
    const EmployeeRestrictedDescription = intl.formatMessage({ id: 'employee.emptyList.description' })

    const { isLoading: isLoadingAuth } = useAuth()
    const organization = useOrganization()
    const { isLoading, link } = organization

    if (isLoading || isLoadingAuth) {
        return <Loader/>
    }

    if (!link) {
        return CreateOrganizationModalForm({ visible: true })
    }
    // <RedirectToOrganizations/>

    const isEmployeeBlocked = get(link, 'isBlocked', false)
    const organizationName = get(link, ['organization', 'name'])

    if (isEmployeeBlocked && withEmployeeRestrictions) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {EmployeeRestrictedTitle}
                </Typography.Title>
                <Typography.Text>
                    {EmployeeRestrictedDescription}
                    <Typography.Text strong> «{organizationName}».</Typography.Text>
                </Typography.Text>
            </BasicEmptyListView>
        )
    }

    if (isFunction(children)) {
        return children(organization)
    }

    return children
}

export function OrganizationRequired ({ children, withEmployeeRestrictions = true }) {
    return (
        <AuthRequired>
            <OrganizationRequiredAfterAuthRequired withEmployeeRestrictions={withEmployeeRestrictions}>
                {children}
            </OrganizationRequiredAfterAuthRequired>
        </AuthRequired>
    )
}
