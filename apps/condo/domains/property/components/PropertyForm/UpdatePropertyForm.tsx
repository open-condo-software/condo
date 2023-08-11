import { Form, Typography } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Button } from '@condo/domains/common/components/Button'
import { Loader } from '@condo/domains/common/components/Loader'
import { Property } from '@condo/domains/property/utils/clientSchema'

import BasePropertyForm from '../BasePropertyForm'

interface IUpdatePropertyForm {
    id: string
}

const FORM_SUBMIT_BUTTON_STYLES = {
    marginTop: '60px',
}
const FORM_DEPENDENCIES = ['address']

export const UpdatePropertyForm: React.FC<IUpdatePropertyForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'applyChanges' })
    const { push } = useRouter()
    const { organization } = useOrganization()
    const { refetch, obj: property, loading, error } = Property.useObject({ where: { id } })
    const initialValues = Property.convertToFormState(property)
    const action = Property.useUpdate({}, (property) => push(`/property/${property.id}`))
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
                                            type='sberDefaultGradient'
                                            loading={isLoading}
                                            disabled={!address}
                                            style={FORM_SUBMIT_BUTTON_STYLES}
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
