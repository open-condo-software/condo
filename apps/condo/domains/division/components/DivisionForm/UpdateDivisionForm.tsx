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
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'

interface IUpdateDivisionForm {
    id: string
}

export const UpdateDivisionForm: React.FC<IUpdateDivisionForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'division.action.delete.confirm.title' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'division.action.delete.confirm.message' })
    const DeleteDivisionLabel = intl.formatMessage({ id: 'division.action.delete.confirm.ok' })
    const router = useRouter()
    const { organization } = useOrganization()
    const { refetch, obj: division, loading, error } = Division.useObject({ where: { id } })

    const initialValues = Division.convertToUIFormState(division)

    const handleCompleteUpdate = (division) => {
        router.push(`/division/${division.id}`)
    }

    const handleCompleteSoftDelete = () => {
        router.push('/property?tab=divisions')
    }

    const action = Division.useUpdate({}, handleCompleteUpdate)
    const updateAction = (value) => action(value, division)

    // TODO: Add separate type for `useSoftDelete` in SBERDOMA-1048
    // @ts-ignore
    const softDeleteAction = Division.useSoftDelete({}, handleCompleteSoftDelete)

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
                                const { properties, responsible } = getFieldsValue(['properties', 'responsible'])
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
                                                    properties={properties}
                                                    responsible={responsible}
                                                />
                                            </Space>
                                            <DeleteButtonWithConfirmModal
                                                title={ConfirmDeleteTitle}
                                                message={ConfirmDeleteMessage}
                                                okButtonLabel={DeleteDivisionLabel}
                                                action={() => softDeleteAction({}, division)}
                                            />
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
