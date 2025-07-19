import { Form, Typography } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { Property } from '@condo/domains/property/utils/clientSchema'

import BasePropertyForm from '../BasePropertyForm'


interface IUpdatePropertyForm {
    id: string
}

const FORM_DEPENDENCIES = ['address']

export const UpdatePropertyForm: React.FC<IUpdatePropertyForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const { push, query: { next }  } = useRouter()
    const { organization } = useOrganization()
    const { refetch, obj: property, loading, error } = Property.useObject({ where: { id } })
    const initialValues = Property.convertToFormState(property)
    const action = Property.useUpdate({}, async (property) => {
        let redirectUrl = `/property/${property.id}`

        if (next && !Array.isArray(next) && isSafeUrl(next)) {
            redirectUrl = next
        }

        await push(redirectUrl)
    })
    const updateAction = (value) => action(value, property)

    useEffect(() => {
        refetch()
    }, [refetch])

    if (error || loading) {
        return (
            <>
                {(loading) ? <Loader size='large' fill/> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </>
        )
    }

    return (
        <BasePropertyForm
            action={updateAction}
            initialValues={initialValues}
            organization={organization}
            type='building'
            address={property.address}
            mode='update'
        >
            {({ handleSave, isLoading }) => {
                return (
                    <>
                        <Form.Item noStyle dependencies={FORM_DEPENDENCIES}>
                            {
                                ({ getFieldsValue }) => {
                                    const { address } = getFieldsValue(['address'])
                                    return (
                                        <Button
                                            key='submit'
                                            onClick={handleSave}
                                            type='primary'
                                            loading={isLoading}
                                            disabled={!address}
                                        >
                                            {ApplyChangesLabel}
                                        </Button>
                                    )
                                }
                            }
                        </Form.Item>
                    </>
                )
            }}
        </BasePropertyForm>
    )
}
