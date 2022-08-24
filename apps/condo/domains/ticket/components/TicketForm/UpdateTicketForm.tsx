import { useRouter } from 'next/router'
import { get, isEmpty } from 'lodash'
import React, { useEffect, useMemo } from 'react'
import { Form, Typography, Space } from 'antd'

import { useOrganization } from '@condo/next/organization'
import { useIntl } from '@condo/next/intl'
import { Button } from '@condo/domains/common/components/Button'

import { Ticket, TicketFile } from '@condo/domains/ticket/utils/clientSchema'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Loader } from '@condo/domains/common/components/Loader'
import { REQUIRED_TICKET_FIELDS, TICKET_SOURCE_TYPES } from '@condo/domains/ticket/constants/common'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'

import { BaseTicketForm, useTicketSettingContext } from '../BaseTicketForm'
import { ErrorsContainer } from '../BaseTicketForm/ErrorsContainer'

const getRequiredDeadline = (ticketSetting, isPaid, isEmergency, isWarranty) => {
    let addDays: number | null = get(ticketSetting, 'defaultDeadline')
    if (isWarranty) addDays = get(ticketSetting, 'warrantyDeadline')
    if (isPaid) addDays = get(ticketSetting, 'paidDeadline')
    if (isEmergency) addDays = get(ticketSetting, 'emergencyDeadline')

    console.log({ addDays, ticketSetting })
    return addDays !== null
}

export const ApplyChangesActionBar = ({ handleSave, isLoading, form }) => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })

    const { ticketSetting } = useTicketSettingContext()

    return (
        <Form.Item noStyle shouldUpdate>
            {
                ({ getFieldsValue }) => {
                    const isPaid = form.getFieldValue('isPaid')
                    const isEmergency = form.getFieldValue('isEmergency')
                    const isWarranty = form.getFieldValue('isWarranty')

                    const isRequiredDeadline = getRequiredDeadline(ticketSetting, isPaid, isEmergency, isWarranty)
                    const { property, details, placeClassifier, categoryClassifier, deadline } = getFieldsValue(REQUIRED_TICKET_FIELDS)
                    const disabledCondition = !property || !details || !placeClassifier || !categoryClassifier || (isRequiredDeadline && !deadline)

                    return (
                        <ActionBar isFormActionBar>
                            <FormResetButton
                                type='sberDefaultGradient'
                                secondary
                            />
                            <Space size={12}>
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='sberDefaultGradient'
                                    loading={isLoading}
                                    disabled={!property}
                                    data-cy='ticket__apply-changes-button'
                                >
                                    {ApplyChangesMessage}
                                </Button>
                                <ErrorsContainer
                                    isVisible={disabledCondition}
                                    property={property}
                                    details={details}
                                    placeClassifier={placeClassifier}
                                    categoryClassifier={categoryClassifier}
                                    deadline={deadline}
                                    isRequiredDeadline={isRequiredDeadline}
                                />
                            </Space>
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}

interface IUpdateTicketForm {
    id: string
}

export const UpdateTicketForm: React.FC<IUpdateTicketForm> = ({ id }) => {
    const { replace } = useRouter()
    const { obj, loading, refetch, error } = Ticket.useObject({ where: { id } })
    const { objs: files, refetch: refetchFiles } = TicketFile.useObjects({ where: { ticket: { id } } })
    const { organization, link } = useOrganization()

    // no redirect after mutation as we need to wait for ticket files to save
    const action = Ticket.useUpdate({})
    const updateAction = async (value) => action(Ticket.formValuesProcessor(value), obj)

    useEffect(() => {
        refetch()
        refetchFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const ticketSourceType = useMemo(() => get(obj, ['source', 'type']), [obj])
    const ticketAssignee = useMemo(() => get(obj, 'assignee'), [obj])

    const autoAssign = isEmpty(ticketAssignee) && ticketSourceType === TICKET_SOURCE_TYPES.MOBILE_APP

    if (error || loading) {
        return (
            <>
                {(loading) ? <Loader fill size='large'/> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </>
        )
    }

    return (
        <BaseTicketForm
            autoAssign={autoAssign}
            action={updateAction}
            initialValues={Ticket.convertToFormState(obj)}
            organization={organization}
            role={link.role}
            files={files}
            afterActionCompleted={(ticket) => {
                replace(`/ticket/${ticket.id}`)
            }}
        >
            {({ handleSave, isLoading, form }) => <ApplyChangesActionBar handleSave={handleSave} isLoading={isLoading} form={form} />}
        </BaseTicketForm>
    )
}
