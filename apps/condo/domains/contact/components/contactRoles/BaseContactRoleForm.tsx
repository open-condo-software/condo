import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { SETTINGS_TAB_CONTACT_ROLES } from '@condo/domains/common/constants/settingsTabs'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { ContactRole } from '@condo/domains/contact/utils/clientSchema'
import { useIntl } from '@condo/next/intl'
import { Col, Form, Input, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { get } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

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
    const ChangesSavedMessage = intl.formatMessage({ id: 'ChangesSaved' })
    const ReadyMessage = intl.formatMessage({ id: 'Ready' })

    const [existingContactRoles, setExistingContactRoles] = useState<Set<string>>()

    const router = useRouter()

    const createContactRoleAction = ContactRole.useCreate({})
    const softDeleteContactRoleAction = ContactRole.useSoftDelete()
    const { objs: contactRoles, loading } = ContactRole.useObjects({
        where: {
            deletedAt: null,
        },
    })

    const { trimValidator, contactRoleValidator } = useValidations()

    const handleFormSubmit = useCallback(async (values) => {
        const initialContactRoleId = get(initialValues, 'id')

        if (!initialContactRoleId) {
            await action({
                ...values,
                organization: { connect: { id: organizationId } },
            })
        } else {
            await action({ ...values })
        }

        await router.push(`/settings?tab=${SETTINGS_TAB_CONTACT_ROLES}`)
    }, [action, createContactRoleAction, initialValues, organizationId, softDeleteContactRoleAction])

    useEffect(() => {
        const roles = contactRoles.map(role => role.name)
        setExistingContactRoles(new Set(roles))
    }, [loading])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <FormWithAction
                    initialValues={initialValues}
                    action={handleFormSubmit}
                    OnCompletedMsg={
                        <>
                            <Typography.Text strong>{ReadyMessage}</Typography.Text>
                            <br/>
                            <Typography.Text>{ChangesSavedMessage}</Typography.Text>
                        </>
                    }
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
                                    rules={[trimValidator, contactRoleValidator(existingContactRoles)]}
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
