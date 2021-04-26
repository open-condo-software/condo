import { Col, Form, Row, Typography } from 'antd'
import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { BasePropertyForm } from '../BasePropertyForm'
import { Button } from '@condo/domains/common/components/Button'
import { ErrorsContainer } from '../BasePropertyForm/ErrorsContainer'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useOrganization } from '@core/next/organization'

interface IUpdatePropertyForm {
    id: string
}


export const UpdatePropertyForm: React.FC<IUpdatePropertyForm> = ({ id }) => {

    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const { push } = useRouter()
    const { organization } = useOrganization()
    const { refetch, obj: property, loading, error } = Property.useObject({ where: { id } })

    const initialValues = Property.convertToUIFormState(property)
    const action = Property.useUpdate({}, (ticket) => push(`/property/${property.id}`))
    const updateAction = (value) => action(value, property)

    useEffect(() => {
        refetch()
    }, [refetch])

    if (error || loading) {
        return (
            <>
                {(loading) ? <Typography.Title>{LoadingMessage}</Typography.Title> : null}
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
                                                {ApplyChangesMessage}
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
