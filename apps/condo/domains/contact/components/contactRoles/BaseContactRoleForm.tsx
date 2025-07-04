import { Col, Form, Input, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { get } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { SETTINGS_TAB_CONTACT_ROLES } from '@condo/domains/common/constants/settingsTabs'
import { useNotificationMessages } from '@condo/domains/common/hooks/useNotificationMessages'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { useExistingContactRoles } from '@condo/domains/contact/components/contactRoles/useExistingContactRoles'

import type { FormRule as Rule } from 'antd'

const LAYOUT = {
    layout: 'horizontal',
}

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]
const COMMON_FORM_ITEM_PROPS = {
    labelCol: {
        sm: 6,
    },
    wrapperCol: {
        sm: 8,
    },
    colon: false,
}

type BaseTicketPropertyHintFormProps = {
    children
    action
    organizationId: string
    initialValues
    mode: string
    hintFilters?: string
}

export const BaseContactRoleForm: React.FC<BaseTicketPropertyHintFormProps> = ({
    children,
    action,
    organizationId,
    initialValues,
}) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'ContactRoles.name' })
    const NamePlaceholderValue = intl.formatMessage({ id: 'ContactRoles.namePlaceholderValue' })
    const ContactRoleIsDuplicateMessage = intl.formatMessage({ id: 'ContactRoles.error.duplicate' })

    const { getSuccessfulChangeNotification } = useNotificationMessages()

    const router = useRouter()

    const existingContactRoles = useExistingContactRoles()

    const { trimValidator } = useValidations()

    const handleFormSubmit = useCallback(async (values) => {
        const initialContactRoleId = get(initialValues, 'id')
        values = { ...values, name: values.name.trim() }

        if (!initialContactRoleId) {
            await action({
                ...values,
                organization: { connect: { id: organizationId } },
            })
        } else {
            await action({ ...values })
        }

        await router.push(`/settings?tab=${SETTINGS_TAB_CONTACT_ROLES}`)
    }, [action, initialValues, organizationId])

    const contactRoleValidator = (existingRoles: Set<string>, initialRole?: string): Rule => ({
        validator: (_, value) => {
            const normalizedValue = value && value.trim()
            const initialRoleName = String(get(initialRole, 'name', '')).trim()

            const hasProhibitedName = normalizedValue && normalizedValue.startsWith('contact.role')
            const isInitialRole = normalizedValue && initialRoleName && normalizedValue === initialRoleName
            const hasInRoleList = normalizedValue && existingRoles.has(normalizedValue)

            if (hasProhibitedName || (hasInRoleList && !isInitialRole)) return Promise.reject(ContactRoleIsDuplicateMessage)

            return Promise.resolve()
        },
    })

    const validationRules = [trimValidator, contactRoleValidator(existingContactRoles, initialValues)]

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <FormWithAction
                    initialValues={initialValues}
                    action={handleFormSubmit}
                    OnCompletedMsg={getSuccessfulChangeNotification}
                    {...LAYOUT}
                >
                    {({ handleSave, isLoading, form }) => (
                        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Form.Item
                                    name='name'
                                    label={NameMessage}
                                    labelAlign='left'
                                    required
                                    rules={validationRules}
                                    {...COMMON_FORM_ITEM_PROPS}
                                >
                                    <Input disabled={!organizationId} placeholder={NamePlaceholderValue}/>
                                </Form.Item>
                            </Col>
                            {children({ handleSave, isLoading, form })}
                        </Row>
                    )}
                </FormWithAction>
            </Col>
        </Row>
    )
}
