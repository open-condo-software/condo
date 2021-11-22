import React, { useEffect } from 'react'
import { Form, Space, Typography } from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import Link from 'next/link'
import BasePropertyMapForm from '../BasePropertyMapForm'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { Loader } from '@condo/domains/common/components/Loader'
import { Button } from '@condo/domains/common/components/Button'
import ActionBar from '@condo/domains/common/components/ActionBar'

interface ICreatePropertyForm {
    id: string
}

const CreatePropertyMapForm: React.FC<ICreatePropertyForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const CancelChangesLabel = intl.formatMessage({ id: 'Cancel' })

    const { push } = useRouter()
    const { organization } = useOrganization()

    const { refetch, obj: property, loading, error } = Property.useObject({ where: { id } })
    const action = Property.useUpdate({}, (property) => push(`/property/${id}`))
    const createAction = (value) => action(value, property)

    const initialValues = Property.convertToUIFormState(property)


    useEffect(() => {
        refetch()
    }, [refetch])

    if (error || loading) {
        return (
            <>
                {(loading) ? <Loader size={'large'} fill/> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </>
        )
    }

    return (
        <BasePropertyMapForm
            id={id}
            action={createAction}
            type='building'
            initialValues={initialValues}
            organization={organization}
            property={property}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Form.Item noStyle dependencies={['address']}>
                        {
                            () => (
                                <ActionBar>
                                    <Space size={12}>
                                        <Button
                                            key='submit'
                                            onClick={handleSave}
                                            type='sberDefaultGradient'
                                            loading={isLoading}
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
                            )
                        }
                    </Form.Item>
                )
            }}
        </BasePropertyMapForm>
    )
}

export default CreatePropertyMapForm
