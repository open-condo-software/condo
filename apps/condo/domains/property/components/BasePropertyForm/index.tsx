// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row, Tabs } from 'antd'
import React from 'react'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { AddressSearchInput } from '@condo/domains/common/components/AddressSearchInput'
import { buildingMapJson } from '@condo/domains/property/constants/property.example'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import BuilderPanel from './BuilderPanel'
import ResidentPanel from './ResidentPanel'


const { TabPane } = Tabs

interface IOrganization {
    id: string
}

interface IPropertyFormProps {
    organization: IOrganization    
    initialValues?: IPropertyFormState
    action?: (...args) => void,
    type: string
}

export const BasePropertyForm: React.FC<IPropertyFormProps> = (props) => {
    const intl = useIntl()

    const AddressLabel = intl.formatMessage({ id: 'pages.condo.property.field.Address' })

    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const NameMsg = intl.formatMessage({ id: 'pages.condo.property.form.field.Name' })

    const BuilderTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.BuilderTabTitle' })
    const ResidentsTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.ResidentsTabTitle' })

    const { action, initialValues } = props

    return (
        <>
            <FormWithAction 
                action={action} 
                initialValues={initialValues} 
                validateTrigger={['onBlur', 'onSubmit']}
                formValuesToMutationDataPreprocessor={(x) => {
                    console.log('AAAAAAAAAAAAAAAAAA', x)
                    const addressMeta = JSON.parse(x['address'])
                    return { ...x, addressMeta, address: addressMeta['address'] }
                }}
            >
                {({ handleSave, isLoading, form }) => (
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
                        <Col span={24}>
                            <Tabs defaultActiveKey='1'>
                                <TabPane tab={BuilderTabTitle} key='1'>
                                    <FocusContainer style={{ margin: 'initial', marginTop: '40px', minHeight: '400px' }}>
                                        <BuilderPanel />
                                    </FocusContainer>
                                </TabPane>
                                <TabPane tab={ResidentsTabTitle} key='2'>
                                    <FocusContainer style={{ margin: 'initial', marginTop: '40px', minHeight: '400px' }}>
                                        <ResidentPanel />
                                    </FocusContainer>
                                </TabPane>
                            </Tabs>
                        </Col>
                        <Col span={24}>
                            {props.children({ handleSave, isLoading, form })}
                        </Col>
                    </Row>
                )}
            </FormWithAction>
        </>
    )
}
