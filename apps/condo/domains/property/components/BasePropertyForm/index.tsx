// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row, Modal, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import React, { useEffect, useState } from 'react'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { AddressSearchInput } from '@condo/domains/common/components/AddressSearchInput'
import { PropertyPanels } from '../panels'
import has from 'lodash/has'
import { useRouter } from 'next/router'

interface IOrganization {
    id: string
}

interface IPropertyFormProps {
    organization: IOrganization
    initialValues?: IPropertyFormState
    action?: (...args) => void
    type: string
}

// Todo(zuch): wait for next.js implement router abort method and remove custom error
// https://github.com/vercel/next.js/issues/2476

const BasePropertyForm: React.FC<IPropertyFormProps> = (props) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const NameMsg = intl.formatMessage({ id: 'pages.condo.property.form.field.Name' })

    const ModalTitle = intl.formatMessage({ id: 'pages.condo.warning.modal.Title' })
    const SaveLabel = intl.formatMessage({ id: 'pages.condo.warning.modal.SaveLabel' })
    const LeaveLabel = intl.formatMessage({ id: 'pages.condo.warning.modal.LeaveLabel' })
    const HelpMessage = intl.formatMessage({ id: 'pages.condo.warning.modal.HelpMessage' })

    const { action, initialValues } = props
    const router = useRouter()

    const [isMapChanged, setIsMapChanged] = useState(false)
    const [next, setNext] = useState(null)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const showModal = () => setIsModalVisible(true)
    const closeModal = () => {
        setIsMapChanged(false)
        setIsModalVisible(false)
    }
    const handleCancel = () => {
        closeModal()
        router.push(next)
    }

    useEffect(() => {
        const onRouteChange = url => {
            if (isMapChanged) {
                setNext(url)
                showModal()
                throw 'Preventing form from close (ignore this error)'
            }
        }
        router.events.on('routeChangeStart', onRouteChange)
        return () => {
            router.events.off('routeChangeStart', onRouteChange)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMapChanged])


    return (
        <>
            <FormWithAction
                action={action}
                initialValues={initialValues}
                validateTrigger={['onBlur', 'onSubmit']}
                formValuesToMutationDataPreprocessor={formData => {
                    try {
                        const newAddress = JSON.parse(formData['address'])
                        if (has(newAddress, 'address')) {
                            // address is created or changed
                            const addressMeta = { dv: 1, ...newAddress }
                            return { ...formData, addressMeta, address: addressMeta['address'] }
                        } else {
                            console.warn('JSON parse failed for ', formData['address'])
                        }
                    } catch (err) {
                        // address is the same
                        return formData
                    }
                }}
            >
                {({ handleSave, isLoading, form }) => {
                    return (
                        <>
                            <Modal
                                visible={isModalVisible}
                                title={
                                    <Typography.Title style={{ fontSize: '24px', lineHeight: '32px' }}>
                                        {ModalTitle}
                                    </Typography.Title>
                                }
                                footer={[
                                    <Button key="back" type='sberDanger' style={{ margin: '16px' }} onClick={handleCancel}>
                                        {LeaveLabel}
                                    </Button>,
                                    <Button key="submit" type='sberPrimary' onClick={() => {
                                        closeModal()
                                        handleSave()
                                    }}>
                                        {SaveLabel}
                                    </Button>,
                                ]}
                            >
                                <Typography.Paragraph>
                                    {HelpMessage}
                                </Typography.Paragraph>
                            </Modal>
                            <Row gutter={[0, 40]}>
                                <Col span={7} >
                                    <Form.Item
                                        name="address"
                                        label={AddressLabel}
                                        rules={[{ required: true, message: FieldIsRequiredMsg }]}
                                    >
                                        <AddressSearchInput />
                                    </Form.Item>
                                </Col>
                                <Col span={7} offset={1}>
                                    <Form.Item
                                        name="name"
                                        label={NameMsg}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={24} >
                                    <Form.Item name='map' hidden >
                                        <Input />
                                    </Form.Item>
                                    <Form.Item shouldUpdate={true}>
                                        {
                                            ({ getFieldsValue, setFieldsValue }) => {
                                                const { map } = getFieldsValue(['map'])
                                                return (
                                                    <PropertyPanels mode='edit' map={map} updateMap={(map) => {
                                                        setIsMapChanged(true)
                                                        setFieldsValue({ map })
                                                    }} />
                                                )
                                            }
                                        }
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    {props.children({ handleSave, isLoading, form })}
                                </Col>
                            </Row>
                        </>
                    )
                }}
            </FormWithAction>
        </>
    )
}

export default BasePropertyForm
