import { Col, Form, Row } from 'antd'
import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { BasePropertyForm } from '../BasePropertyForm'
import { Button } from '@condo/domains/common/components/Button'
import { ErrorsContainer } from '../BasePropertyForm/ErrorsContainer'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { buildingMapJson } from '@condo/domains/property/constants/property.example'

const DEFAULT_PROPERTY_TYPE = 'building'

export const CreatePropertyForm: React.FC = () => {
    const intl = useIntl()
    const CreatePropertyMessage = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const router = useRouter()
    const { organization } = useOrganization()
    const action = Property.useCreate({ 
        organization: organization.id,
        type: DEFAULT_PROPERTY_TYPE,
        map: buildingMapJson,
    }, () => { router.push('/property/') })

    const initialValues = {
        name: '',
        map: buildingMapJson,
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
                                    <Row gutter={[0, 24]}>
                                        <ErrorsContainer address={address} />
                                        <Col span={24}>
                                            <Button
                                                key='submit'
                                                onClick={handleSave}
                                                type='sberPrimary'
                                                loading={isLoading}
                                                disabled={!address}
                                            >
                                                {CreatePropertyMessage}
                                            </Button>
                                        </Col>
                                    </Row>
                                )
                            }
                        }
                    </Form.Item>
                )
            }}
        </BasePropertyForm>
    )
}
