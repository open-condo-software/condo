import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { Loader } from '@condo/domains/common/components/Loader'
import { SETTINGS_TAB_CONTACT_ROLES } from '@condo/domains/common/constants/settingsTabs'
import { ContactRole } from '@condo/domains/contact/utils/clientSchema'
import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { get } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

const LAYOUT = {
    layout: 'horizontal',
}

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]
const APARTMENT_COMPLEX_NAME_FIELD_PROPS = {
    labelCol: {
        sm: 6,
    },
    wrapperCol: {
        sm: 8,
    },
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
    hintFilters,
    children,
    action,
    organizationId,
    initialValues,
    mode,
}) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'ContactRoles.name' })

    const router = useRouter()

    const createContactRoleAction = ContactRole.useCreate({})
    const softDeleteContactRoleAction = ContactRole.useSoftDelete()

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

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <FormWithAction
                    initialValues={initialValues}
                    action={handleFormSubmit}
                    {...LAYOUT}
                >
                    {({ handleSave, isLoading, form }) => (
                        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Form.Item
                                    name={'name'}
                                    label={NameMessage}
                                    labelAlign={'left'}
                                    {...APARTMENT_COMPLEX_NAME_FIELD_PROPS}
                                >
                                    <Input disabled={!organizationId}/>
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
