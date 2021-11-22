import { Form, Space, Typography, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import BasePropertyForm from '../BasePropertyForm'
import { Button } from '@condo/domains/common/components/Button'
import { ErrorsContainer } from '../BasePropertyForm/ErrorsContainer'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Loader } from '@condo/domains/common/components/Loader'
import { PropertyPanels } from '@condo/domains/property/components/panels'

interface IUpdatePropertyForm {
    id: string
}

export const UpdatePropertyForm: React.FC<IUpdatePropertyForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const SameUnitNamesErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })
    const { push } = useRouter()
    const { organization } = useOrganization()
    const { refetch, obj: property, loading, error } = Property.useObject({ where: { id } })
    const initialValues = Property.convertToUIFormState(property)
    const action = Property.useUpdate({}, (property) => push(`/property/${property.id}`))
    const updateAction = (value) => action(value, property)
    const [mapValidationError, setMapValidationError] = useState<string | null>(null)

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
                        <Form.Item
                            hidden
                            name='map'
                            rules={[
                                {
                                    validator (rule, value) {
                                        const unitLabels = value?.sections
                                            ?.map((section) => section.floors
                                                ?.map(floor => floor.units
                                                    ?.map(unit => unit.label)
                                                )
                                            )
                                            .flat(2)

                                        if (unitLabels && unitLabels.length !== new Set(unitLabels).size) {
                                            setMapValidationError(SameUnitNamesErrorMsg)
                                            return Promise.reject()
                                        }

                                        setMapValidationError(null)
                                        return Promise.resolve()
                                    },
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            shouldUpdate={true}
                            // @ts-ignore
                            onBlur={() => setMapValidationError(null)}
                        >
                            {
                                ({ getFieldsValue, setFieldsValue }) => {
                                    const { map } = getFieldsValue(['map'])
                                    return (
                                        <PropertyPanels
                                            mapValidationError={mapValidationError}
                                            mode='edit'
                                            map={map}
                                            handleSave={handleSave}
                                            updateMap={map => setFieldsValue({ map })}
                                            address={property.address}
                                        />
                                    )
                                }
                            }
                        </Form.Item>
                        <Form.Item noStyle dependencies={['address']}>
                            {
                                ({ getFieldsValue }) => {
                                    const { address } = getFieldsValue(['address'])
                                    return (
                                        <>
                                            <ActionBar>
                                                <FormResetButton
                                                    type={'sberPrimary'}
                                                    secondary
                                                />
                                                <Space size={12}>
                                                    <Button
                                                        key='submit'
                                                        onClick={handleSave}
                                                        type='sberPrimary'
                                                        loading={isLoading}
                                                        disabled={!address}
                                                    >
                                                        {ApplyChangesLabel}
                                                    </Button>
                                                    <ErrorsContainer address={address} />
                                                </Space>
                                            </ActionBar>
                                        </>
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
