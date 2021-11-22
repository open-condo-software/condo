import React from 'react'
import { Form } from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import BasePropertyForm from '../BasePropertyForm'
import { Button } from '@condo/domains/common/components/Button'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useOrganization } from '@core/next/organization'

const DEFAULT_PROPERTY_TYPE = 'building'

export const CreatePropertyForm: React.FC = () => {
    const intl = useIntl()
    const CreatePropertyMessage = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const router = useRouter()
    const { organization } = useOrganization()
    const action = Property.useCreate({
        organization: organization.id,
        type: DEFAULT_PROPERTY_TYPE,
    }, () => { router.push('/property/') })

    const initialValues = {
        name: '',
    }

    return (
        <BasePropertyForm
            action={action}
            initialValues={initialValues}
            organization={organization}
            type='building'
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Form.Item noStyle dependencies={['address']}>
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
                                        style={{ marginTop: 60 }}
                                    >{CreatePropertyMessage}</Button>
                                )
                            }
                        }
                    </Form.Item>
                )
            }}
        </BasePropertyForm>
    )
}
