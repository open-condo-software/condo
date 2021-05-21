import { Col, Form, Row, Space, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import BasePropertyForm from '../BasePropertyForm'
import { Button } from '@condo/domains/common/components/Button'
import { ErrorsContainer } from '../BasePropertyForm/ErrorsContainer'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import Modal from 'antd/lib/modal/Modal'

interface IUpdatePropertyForm {
    id: string
}


export const UpdatePropertyForm: React.FC<IUpdatePropertyForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const DeletePropertyLabel = intl.formatMessage({ id: 'pages.condo.property.form.DeleteLabel' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteMessage' })
    const { push } = useRouter()
    const { organization } = useOrganization()
    const { refetch, obj: property, loading, error } = Property.useObject({ where: { id } })
    const initialValues = Property.convertToUIFormState(property)
    const action = Property.useUpdate({}, (property) => push(`/property/${property.id}`))
    const updateAction = (value) => action(value, property)
    const softDeleteAction = Property.useSoftDelete({}, () => push('/property/'))
  
    const [isConfirmVisible, setIsConfirmVisible] = useState(false)
    const showConfirm = () => setIsConfirmVisible(true)
    const handleOk = () => {
        setIsConfirmVisible(false)
        handleDelete({ item: property })
    }
    const handleCancel = () => setIsConfirmVisible(false)

    
    function handleDelete ({ item }) {
        return runMutation(
            {
                action: () => {
                    return softDeleteAction({}, item)
                },
                onError: (e) => {
                    console.log(e)
                    console.log(e.friendlyDescription)
                    throw e
                },
                intl,
            },
        )
    }

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
                                    <>
                                        <Row gutter={[40, 24]} style={{ paddingLeft: '24px', paddingRight: '24px', justifyContent: 'space-between' }}>
                                            <Col span={24} push={2}>
                                                <ErrorsContainer address={address} />
                                            </Col>
                                            <Col flex={0}>
                                                <Space size={40}>
                                                    <FormResetButton
                                                        type={'sberPrimary'}
                                                        secondary
                                                    />                                                
                                                    <Button
                                                        key='submit'
                                                        onClick={handleSave}
                                                        type='sberPrimary'
                                                        loading={isLoading}
                                                        disabled={!address}
                                                    >
                                                        {ApplyChangesLabel}
                                                    </Button>                                                                                   
                                                </Space>
                                            </Col>
                                            <Col flex={0}>
                                                <Modal 
                                                    title={
                                                        <Typography.Title style={{ fontSize: '24px', lineHeight: '32px' }}>
                                                            {ConfirmDeleteTitle}
                                                        </Typography.Title>
                                                    }
                                                    visible={isConfirmVisible} 
                                                    onCancel={handleCancel}
                                                    footer={[
                                                        <Button 
                                                            key="submit" 
                                                            type='sberDanger' 
                                                            onClick={handleOk}
                                                            style={{ margin: '15px' }}
                                                        >
                                                            {DeletePropertyLabel}
                                                        </Button>,
                                                    ]}                                                    
                                                >
                                                    <Typography.Text>
                                                        {ConfirmDeleteMessage}
                                                    </Typography.Text>
                                                </Modal>
                                                <Button
                                                    key='submit'
                                                    onClick={showConfirm}
                                                    type='sberDanger'
                                                    loading={isLoading}
                                                    secondary
                                                >
                                                    {DeletePropertyLabel}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </>
                                )
                            }
                        }
                    </Form.Item>
                )
            }}
        </BasePropertyForm>
    )
}
