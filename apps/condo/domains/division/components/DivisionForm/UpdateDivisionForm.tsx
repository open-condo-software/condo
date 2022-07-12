import { Form, Space, Typography } from 'antd'
import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import BaseDivisionForm from '../BaseDivisionForm'
import { Button } from '@condo/domains/common/components/Button'
import { ErrorsContainer } from '../BaseDivisionForm/ErrorsContainer'
import { Division } from '@condo/domains/division/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Loader } from '@condo/domains/common/components/Loader'

interface IUpdateDivisionForm {
    id: string
}

export const UpdateDivisionForm: React.FC<IUpdateDivisionForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'ApplyChanges' })

    const router = useRouter()
    const { organization } = useOrganization()
    const { refetch, obj: division, loading, error } = Division.useObject({ where: { id } })

    const initialValues = Division.convertToFormState(division)

    const handleCompleteUpdate = (division) => {
        router.push(`/division/${division.id}`)
    }

    const action = Division.useUpdate({}, handleCompleteUpdate)
    const updateAction = (value) => action(Division.formValuesProcessor(value), division)

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
        <BaseDivisionForm
            action={updateAction}
            initialValues={initialValues}
            organization={organization}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Form.Item noStyle dependencies={['properties', 'responsible']}>
                        {
                            ({ getFieldsValue }) => {
                                const { name, properties, responsible, executors } = getFieldsValue(
                                    ['name', 'properties', 'responsible', 'executors']
                                )
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
                                                    disabled={!properties || properties.length === 0 || !responsible}
                                                >
                                                    {ApplyChangesLabel}
                                                </Button>
                                                <ErrorsContainer
                                                    name={name || ''}
                                                    properties={properties}
                                                    responsible={responsible}
                                                    executors={executors}
                                                />
                                            </Space>
                                        </ActionBar>
                                    </>
                                )
                            }
                        }
                    </Form.Item>
                )
            }}
        </BaseDivisionForm>
    )
}
