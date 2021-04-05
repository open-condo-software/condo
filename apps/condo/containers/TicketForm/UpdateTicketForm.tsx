import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { useOrganization } from '@core/next/organization'
import { Col, Form, Row, Typography, Space } from 'antd'
import { useIntl } from '@core/next/intl'
import { BaseTicketForm } from '../../components/BaseTicketForm'
import { Button } from '../../components/Button'
import { ErrorsContainer } from '../../components/BaseTicketForm/ErrorsContainer'
import { FormResetButton } from '../../components/FormResetButton'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'

interface IUpdateTicketForm {
    id: string
}

export const UpdateTicketForm: React.FC<IUpdateTicketForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const { push } = useRouter()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { organization } = useOrganization()
    const { obj, loading, refetch, error } = Ticket.useObject({ where: { id } })
    const action = Ticket.useUpdate({}, (ticket) => push(`/ticket/${ticket.id}`))
    const updateAction = (value) => action(value, obj)

    useEffect(() => {
        refetch()
    }, [])
        
    if (error || loading) {
        return (
            <>
                {(loading) ? <Typography.Title>{LoadingMessage}</Typography.Title> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </>
        )
    }

    return (
        <BaseTicketForm
            action={updateAction}
            initialValues={Ticket.convertToUIFormState(obj)}
            organization={organization}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Form.Item noStyle dependencies={['property', 'unitName']}>
                        {
                            ({ getFieldsValue }) => {
                                const { property, unitName } = getFieldsValue(['property', 'unitName'])

                                return (
                                    <Row gutter={[0, 24]}>
                                        <ErrorsContainer property={property} unitName={unitName}/>
                                        <Col span={24}>
                                            <Space size={40}>
                                                <FormResetButton
                                                    type='sberPrimary'
                                                    secondary
                                                />
                                                <Button
                                                    key='submit'
                                                    onClick={handleSave}
                                                    type='sberPrimary'
                                                    loading={isLoading}
                                                    disabled={!property || !unitName}
                                                >
                                                    {ApplyChangesMessage}
                                                </Button>
                                            </Space>
                                        </Col>
                                    </Row>
                                )
                            }
                        }
                    </Form.Item>
                )
            }}
        </BaseTicketForm>
    )
}
