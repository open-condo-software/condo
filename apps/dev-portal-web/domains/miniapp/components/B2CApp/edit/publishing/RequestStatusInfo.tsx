import React, { useCallback } from 'react'
import { useIntl, FormattedMessage } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Alert, Space, Typography, Button, Checkbox } from '@open-condo/ui'

import { Spin } from '@/domains/common/components/Spin'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'

import styles from './RequestStatusInfo.module.css'

import type { AllB2CAppPublishRequestsQuery } from '@/lib/gql'

import { useCreateB2CAppPublishRequestMutation, AllB2CAppPublishRequestsDocument } from '@/lib/gql'


type RequestStatusInfoProps = {
    appId: string
    request: NonNullable<AllB2CAppPublishRequestsQuery['requests']>[number]
    loading: boolean
}

const fieldsToCheck = [
    'isAppTested',
    'isInfoApproved',
    'isContractSigned',
] as const

export const RequestStatusInfo: React.FC<RequestStatusInfoProps> = ({ appId, request, loading }) => {
    const intl = useIntl()
    const VerificationRequiredTitle = intl.formatMessage({ id: 'apps.id.verification.verificationRequiredAlert.title' })
    const VerificationRequiredDetailsAboutText = intl.formatMessage({ id: 'apps.id.verification.verificationRequiredAlert.details.aboutVerification' })
    const RequestVerificationLabel = intl.formatMessage({ id: 'apps.id.verification.verificationRequiredAlert.actions.requestVerification' })
    const VerificationRequiredDetailsNextStepsText = intl.formatMessage({ id: 'apps.id.verification.verificationRequiredAlert.details.nextSteps' }, {
        action: RequestVerificationLabel,
    })
    const VerificationStatusTitle = intl.formatMessage({ id: 'apps.id.verification.activeVerificationAlert.title' })
    const StandLabel = intl.formatMessage({ id: 'apps.environments.production.label' })
    const VerificationDetailsText = intl.formatMessage({ id: 'apps.id.verification.activeVerificationAlert.details.text' }, {
        stand: StandLabel.toLowerCase(),
    })

    const onError = useMutationErrorHandler()
    const [createRequestMutation] = useCreateB2CAppPublishRequestMutation({
        onError,
        refetchQueries: [
            { query: AllB2CAppPublishRequestsDocument, variables: { appId } },
        ],
    })

    const handleRequestVerification = useCallback(() => {
        return createRequestMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    app: { connect: { id: appId } },
                },
            },
        })
    }, [appId, createRequestMutation])

    if (loading) {
        return (
            <Spin size='large'/>
        )
    }

    if (!request) {
        return (
            <Space direction='vertical' size={40}>
                <Alert
                    type='warning'
                    message={VerificationRequiredTitle}
                    description={(
                        <Space direction='vertical' size={16}>
                            <Typography.Paragraph size='medium'>
                                {VerificationRequiredDetailsAboutText}
                            </Typography.Paragraph>
                            <Typography.Paragraph size='medium'>
                                {VerificationRequiredDetailsNextStepsText}
                            </Typography.Paragraph>
                        </Space>
                    )}
                    showIcon
                />
                <Button type='primary' onClick={handleRequestVerification}>{RequestVerificationLabel}</Button>
            </Space>
        )
    }

    return (
        <Alert
            type='info'
            message={VerificationStatusTitle}
            description={(
                <Space size={12} direction='vertical'>
                    <Typography.Paragraph size='medium'>{VerificationDetailsText}</Typography.Paragraph>
                    <Space size={8} direction='vertical' className={styles.checkboxList}>
                        {fieldsToCheck.map((field) => (
                            <Checkbox key={field} disabled checked={request[field] || false}>
                                <Typography.Text size='medium' type='secondary'><FormattedMessage id={`apps.id.verification.activeVerificationAlert.checkboxes.${field}.label`}/></Typography.Text>
                            </Checkbox>
                        ))}
                    </Space>
                </Space>
            )}
        />
    )
}