import { PropertyTypeType } from '@app/condo/schema'
import { Form } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Tour } from '@open-condo/ui'

import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import BasePropertyForm from '@condo/domains/property/components/BasePropertyForm'
import { Property } from '@condo/domains/property/utils/clientSchema'


const DEFAULT_PROPERTY_TYPE = PropertyTypeType.Building
const FORM_DEPENDENCIES = ['address']

export const CreatePropertyForm: React.FC = () => {
    const intl = useIntl()
    const CreatePropertyMessage = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const { push, query: { next } } = useRouter()
    const { organization, link } = useOrganization()
    const { user } = useAuth()

    const action = Property.useCreate({
        organization: { connect: { id: organization.id } },
        type: DEFAULT_PROPERTY_TYPE,
    }, async (property) => {
        let redirectUrl = `/property/${property.id}`

        if (next && !Array.isArray(next) && isSafeUrl(next)) {
            redirectUrl = next
        }

        await push(redirectUrl)
    })

    const initialValues = {
        name: '',
        yearOfConstruction: '',
    }

    const canManageProperties = get(link, 'role.canManageProperties', false)
    const { currentStep } = Tour.useTourContext()
    const { count } = Property.useCount({
        where: {
            createdBy: { id: get(user, 'id', null) },
        },
    }, { skip: !user })

    return (
        <BasePropertyForm
            action={action}
            initialValues={initialValues}
            organization={organization}
            type='building'
            mode='create'
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Form.Item noStyle dependencies={FORM_DEPENDENCIES}>
                        {
                            ({ getFieldsValue }) => {
                                const { address } = getFieldsValue(['address'])

                                return (
                                    <Space size={24} direction='horizontal'>
                                        <Button
                                            key='submit'
                                            onClick={handleSave}
                                            type='primary'
                                            loading={isLoading}
                                            disabled={!canManageProperties || !address}
                                            focus={count === 0 && currentStep === 1}
                                        >
                                            {CreatePropertyMessage}
                                        </Button>
                                    </Space>
                                )
                            }
                        }
                    </Form.Item>
                )
            }}
        </BasePropertyForm>
    )
}
