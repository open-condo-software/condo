import { Tooltip, Typography } from 'antd'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { CountdownTimer } from '@condo/domains/common/components/CountDownTimer'
import { useOrganization } from '@core/next/organization'
import { OrganizationEmployee } from '../../../schema'
import { canReinviteEmployee } from '../permissions'

interface IEmployeeInviteRetryButtonProps {
    employee: OrganizationEmployee
}

export const EmployeeInviteRetryButton: React.FC<IEmployeeInviteRetryButtonProps> = (props) => {
    const intl = useIntl()
    const RetryInviteMessage = intl.formatMessage({ id: 'employee.RetryInvite' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const Seconds = intl.formatMessage({ id: 'Seconds' })
    const { link } = useOrganization()

    const { employee } = props
    const isEmployeeReinvitable = canReinviteEmployee(link, employee)

    const resetEmployeeInvite = () => {
        if (!isEmployeeReinvitable) {
            return Promise.resolve()
        }

        console.log('resetEmployeeInvite')
        return Promise.resolve()
    }

    return isEmployeeReinvitable && (
        <CountdownTimer action={resetEmployeeInvite} id={'RESET_EMPLOYEE_INVITE'}>
            {({ countdown, runAction, loading }) => {
                const isCountDownActive = countdown > 0

                return (
                    <Tooltip title={NotImplementedYetMessage}>
                        <Button
                            // onClick={runAction}
                            type={'inlineLink'}
                            loading={loading}
                            disabled={isCountDownActive}
                        >
                            {RetryInviteMessage}
                            {isCountDownActive && (
                                <Typography.Text type={'secondary'}>
                                    &nbsp;
                                    ({ countdown } {Seconds})
                                </Typography.Text>
                            )}
                        </Button>
                    </Tooltip>
                )
            }}
        </CountdownTimer>
    )
}
