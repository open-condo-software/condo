import { PropertyTypeType } from '@app/condo/schema'
import { Form } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Button } from '@condo/domains/common/components/Button'
import BasePropertyForm from '@condo/domains/property/components/BasePropertyForm'
import { Property } from '@condo/domains/property/utils/clientSchema'



const DEFAULT_PROPERTY_TYPE = PropertyTypeType.Building

const FORM_SUBMIT_BUTTON_STYLES = {
    marginTop: '60px',
}
const FORM_DEPENDENCIES = ['address']

export const CreatePropertyForm: React.FC = () => {
    const intl = useIntl()
    const CreatePropertyMessage = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const router = useRouter()
    const { organization, link } = useOrganization()
    const action = Property.useCreate({
        organization: { connect: { id: organization.id } },
        type: DEFAULT_PROPERTY_TYPE,
    }, async (property) => { await router.push(`/property/${property.id}`) })

    const initialValues = {
        name: '',
        yearOfConstruction: '',
    }

    const canManageProperties = get(link, 'role.canManageProperties', false)

    return (
        <BasePropertyForm
            action={action}
            initialValues={initialValues}
            organization={organization}
            type='building'
        >
            {({ handleSave, isLoading }) => {
                return (
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
                                        disabled={!canManageProperties || !address}
                                        style={FORM_SUBMIT_BUTTON_STYLES}
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
