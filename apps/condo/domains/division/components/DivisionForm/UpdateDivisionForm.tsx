import { Form, Space, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import BaseDivisionForm from '../BaseDivisionForm'
import { Button } from '@condo/domains/common/components/Button'
import { ErrorsContainer } from '../BaseDivisionForm/ErrorsContainer'
import { Division } from '@condo/domains/division/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import Modal from 'antd/lib/modal/Modal'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Loader } from '@condo/domains/common/components/Loader'
import { omit } from 'lodash'

interface IUpdateDivisionForm {
    id: string
}

export const UpdateDivisionForm: React.FC<IUpdateDivisionForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const DeleteDivisionLabel = intl.formatMessage({ id: 'division.form.actions.delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.division.form.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.division.form.ConfirmDeleteMessage' })
    const router = useRouter()
    const { organization } = useOrganization()
    const { refetch, obj: division, loading, error } = Division.useObject({ where: { id } })

    const initialValues = Division.convertToUIFormState(division)

    const handleCompleteUpdate = (division) => {
        router.push(`/division/${division.id}`)
    }

    const handleCompleteSoftDelete = () => {
        router.push('/division/')
    }

    const action = Division.useUpdate({}, handleCompleteUpdate)
    const updateAction = (value) => action(value, division)

    // TODO: Add separate type for `useSoftDelete` in SBERDOMA-1048
    // @ts-ignore
    const softDeleteAction = Division.useSoftDelete({}, handleCompleteSoftDelete)

    const [isConfirmVisible, setIsConfirmVisible] = useState(false)
    const showConfirm = () => setIsConfirmVisible(true)

    const handleSoftDelete = () => {
        setIsConfirmVisible(false)
        return runMutation(
            {
                action: () => {
                    // TODO: Add separate type for `useSoftDelete` in SBERDOMA-1048
                    // @ts-ignore
                    return softDeleteAction({}, division)
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

    const handleCancel = () => setIsConfirmVisible(false)


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
                                                    onClick={handleSoftDelete}
                                                    style={{ margin: '15px' }}
                                                >
                                                    {DeleteDivisionLabel}
                                                </Button>,
                                            ]}
                                        >
                                            <Typography.Text>
                                                {ConfirmDeleteMessage}
                                            </Typography.Text>
                                        </Modal>
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
                                            <Button
                                                key='submit'
                                                onClick={showConfirm}
                                                type='sberDanger'
                                                loading={isLoading}
                                                secondary
                                                style={{ position: 'absolute', right: '0px', top: '24px' }}
                                            >
                                                {DeleteDivisionLabel}
                                            </Button>
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
