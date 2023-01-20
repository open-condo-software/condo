import { OrganizationEmployee } from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import React, { useCallback } from 'react'

import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Button } from '@condo/domains/common/components/Button'
import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { REINVITE_ORGANIZATION_EMPLOYEE_MUTATION } from '@condo/domains/organization/gql'
interface IEmployeeInviteRetryButtonProps {
    employee: OrganizationEmployee
}

export const EmployeeInviteRetryButton: React.FC<IEmployeeInviteRetryButtonProps> = (props) => {
    const intl = useIntl()
    const RetryInviteMessage = intl.formatMessage({ id: 'employee.RetryInvite' })
    const Seconds = intl.formatMessage({ id: 'Seconds' })

    const { link, organization } = useOrganization()

    const { employee } = props

    const isEmployeeReinvitable = get(link, ['role', 'canManageEmployees'], null) && !get(employee, 'isAccepted')
    const [reInviteEmployeeMutation] = useMutation(REINVITE_ORGANIZATION_EMPLOYEE_MUTATION)
    const reInviteEmployee = useCallback(() => {
        const sender = getClientSideSenderInfo()
        const meta = { dv: 1, sender }
        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: reInviteEmployeeMutation,
            variables: {
                data: {
                    email: get(employee, 'email'),
                    phone: get(employee, 'phone'),
                    organization: { id: organization.id },
                    ...meta,
                },
            },
            intl,
        })
    }, [employee, organization])

    return isEmployeeReinvitable && (
        <CountDownTimer action={reInviteEmployee} id='RESET_EMPLOYEE_INVITE'>
            {({ countdown, runAction, loading }) => {
                const isCountDownActive = countdown > 0

                return (
                    <Button
                        type='inlineLink'
                        loading={loading}
                        disabled={isCountDownActive}
                        onClick={runAction}
                    >
                        {RetryInviteMessage}
                        {isCountDownActive && (
                            <Typography.Text type='secondary'>
                                &nbsp;
                                ({ countdown } {Seconds})
                            </Typography.Text>
                        )}
                    </Button>
                )
            }}
        </CountDownTimer>
    )
}
