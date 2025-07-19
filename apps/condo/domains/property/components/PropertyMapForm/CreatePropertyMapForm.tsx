import { Form, Typography } from 'antd'
import get from 'lodash/get'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import BasePropertyMapForm from '@condo/domains/property/components/BasePropertyMapForm'
import { Property } from '@condo/domains/property/utils/clientSchema'


interface ICreatePropertyForm {
    id: string
}

const PROPERTY_FORM_DEPENDENCIES = ['address']

const CreatePropertyMapForm: React.FC<ICreatePropertyForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const CancelChangesLabel = intl.formatMessage({ id: 'Cancel' })

    const client = useApolloClient()
    const { push } = useRouter()
    const { organization, link } = useOrganization()

    const { refetch, obj: property, loading, error } = Property.useObject({ where: { id } })
    const action = Property.useUpdate({}, () => push(`/property/${id}`))
    const updatePropertyAction = (value) => action(value, property).then(() => {
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: '_allPropertiesMeta' })
        client.cache.gc()
    })

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
                        <ActionBar
                            actions={[
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='primary'
                                    loading={isLoading}
                                    hidden={!canManageProperties}
                                >
                                    {ApplyChangesLabel}
                                </Button>,
                                <Link key='cancel' href={`/property/${id}`}>
                                    <Button type='secondary'>
                                        {CancelChangesLabel}
                                    </Button>
                                </Link>,
                            ]}
                        >
                        </ActionBar>
                    </Form.Item>
                )
            }}
        </BasePropertyMapForm>
    )
}

export default CreatePropertyMapForm
