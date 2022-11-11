import React, { useEffect } from 'react'
import { Form, Space, Typography } from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@open-condo/next/intl'
import get from 'lodash/get'
import Link from 'next/link'
import BasePropertyMapForm from '@condo/domains/property/components/BasePropertyMapForm'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useOrganization } from '@open-condo/next/organization'
import { Loader } from '@condo/domains/common/components/Loader'
import { Button } from '@condo/domains/common/components/Button'
import ActionBar from '@condo/domains/common/components/ActionBar'

interface ICreatePropertyForm {
    id: string
}

const PROPERTY_FORM_DEPENDENCIES = ['address']

const CreatePropertyMapForm: React.FC<ICreatePropertyForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const CancelChangesLabel = intl.formatMessage({ id: 'Cancel' })

    const { push } = useRouter()
    const { organization, link } = useOrganization()

    const { refetch, obj: property, loading, error } = Property.useObject({ where: { id } })
    const action = Property.useUpdate({}, () => push(`/property/${id}`))
    const updatePropertyAction = (value) => action(value, property)

    const initialValues = Property.convertToFormState(property)

    useEffect(() => {
        refetch()
    }, [refetch])

    const canManageProperties = get(link, 'role.canManageProperties', false)

    if (error) {
        return <Typography.Title>{error}</Typography.Title>
    }

    if (loading) {
        return <Loader size='large' fill />
    }

    return (
        <BasePropertyMapForm
            id={id}
            action={updatePropertyAction}
            type='building'
            initialValues={initialValues}
            organization={organization}
            property={property}
            canManageProperties={canManageProperties}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Form.Item noStyle dependencies={PROPERTY_FORM_DEPENDENCIES}>
                        <ActionBar>
                            <Space size={12}>
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='sberDefaultGradient'
                                    loading={isLoading}
                                    hidden={!canManageProperties}
                                >
                                    {ApplyChangesLabel}
                                </Button>
                                <Link href={`/property/${id}`}>
                                    <Button
                                        key='cancel'
                                        secondary
                                        type='sberDefaultGradient'>
                                        {CancelChangesLabel}
                                    </Button>
                                </Link>
                            </Space>
                        </ActionBar>
                    </Form.Item>
                )
            }}
        </BasePropertyMapForm>
    )
}

export default CreatePropertyMapForm
