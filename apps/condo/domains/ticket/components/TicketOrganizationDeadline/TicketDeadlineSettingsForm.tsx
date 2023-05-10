import { Col, Form, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import Select from '@condo/domains/common/components/antd/Select'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useNotificationMessages } from '@condo/domains/common/hooks/useNotificationMessages'
import { MIN_TICKET_DEADLINE_DURATION, MAX_TICKET_DEADLINE_DURATION } from '@condo/domains/ticket/constants/common'
import { TicketOrganizationSetting as TicketSetting } from '@condo/domains/ticket/utils/clientSchema'
import { convertDurationToDays } from '@condo/domains/ticket/utils/helpers'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 24,
        md: 5,
    },
    wrapperCol: {
        span: 24,
        md: 6,
    },
    styled: {
        paddingBottom: '12px',
    },
    colon: false,
}
const BIG_ROW_GUTTERS: [Gutter, Gutter] = [0, 60]
const MIDDLE_ROW_GUTTERS: [Gutter, Gutter] = [0, 40]
const SMALL_ROW_GUTTERS: [Gutter, Gutter] = [0, 20]
const MAX_TICKET_DEADLINE_DURATION_AS_DAYS = convertDurationToDays(MAX_TICKET_DEADLINE_DURATION)
const MIN_TICKET_DEADLINE_DURATION_AS_DAYS = convertDurationToDays(MIN_TICKET_DEADLINE_DURATION)

export const TicketDeadlineSettingsForm: React.FC = () => {
    const intl = useIntl()
    const OptionWithoutDeadlineLabel = intl.formatMessage({ id: 'settings.ticketDeadlines.options.withoutDeadline' })
    const OptionCurrentDateLabel = intl.formatMessage({ id: 'settings.ticketDeadlines.options.currentDate' })
    const DefaultDeadlineLabel = intl.formatMessage({ id: 'settings.ticketDeadlines.defaultDeadline.label' })
    const PaidDeadlineLabel = intl.formatMessage({ id: 'settings.ticketDeadlines.paidDeadline.label' })
    const EmergencyDeadlineLabel = intl.formatMessage({ id: 'settings.ticketDeadlines.emergencyDeadline.label' })
    const WarrantyDeadlineLabel = intl.formatMessage({ id: 'settings.ticketDeadlines.warrantyDeadline.label' })
    const SelectLabel = intl.formatMessage({ id: 'settings.ticketDeadlines.select.label' })
    const SaveMessage = intl.formatMessage({ id: 'Save' })

    const { getSuccessfulChangeNotification } = useNotificationMessages()

    const router = useRouter()

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const { obj: ticketSetting, loading } = TicketSetting.useObject({
        where: {
            organization: { id: userOrganizationId },
        },
    })

    const action = TicketSetting.useUpdate({})
    const updateAction = useCallback(async (value) => {
        await action(TicketSetting.formValuesProcessor(value), ticketSetting)
        await router.push('/settings?tab=controlRoom')
    }, [action, router, ticketSetting])

    const initialValues = useMemo(() => TicketSetting.convertToFormState(ticketSetting), [ticketSetting])

    const options = useMemo(() => {
        const range = new Array(MAX_TICKET_DEADLINE_DURATION_AS_DAYS - MIN_TICKET_DEADLINE_DURATION_AS_DAYS + 2).fill(1)
        return range.map((item, index) => {
            const value = index === range.length - 1 ? null : index

            let label
            if (index === 0) label = `+${intl.formatMessage({ id: 'DaysShort' }, { days: index })} (${OptionCurrentDateLabel})`
            else if (index === range.length - 1) label = OptionWithoutDeadlineLabel
            else label = `+${intl.formatMessage({ id: 'DaysShort' }, { days: index })}`

            return <Select.Option value={value} key={value}>{label}</Select.Option>
        })
    }, [OptionCurrentDateLabel, OptionWithoutDeadlineLabel, intl])

    const settingsForm = useMemo(() => (
        <FormWithAction
            initialValues={initialValues}
            action={updateAction}
            colon={false}
            layout='horizontal'
            OnCompletedMsg={getSuccessfulChangeNotification}
        >
            {({ handleSave, isLoading }) => (
                <Row gutter={BIG_ROW_GUTTERS}>
                    <Col span={24}>
                        <Row gutter={MIDDLE_ROW_GUTTERS}>
                            <Col span={24}>
                                <Row gutter={SMALL_ROW_GUTTERS}>
                                    <Col span={24}>
                                        <Typography.Title level={5}>{DefaultDeadlineLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name='defaultDeadlineDuration'
                                            label={SelectLabel}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Select
                                                defaultValue={initialValues.defaultDeadlineDuration}
                                            >
                                                {options}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Row gutter={SMALL_ROW_GUTTERS}>
                                    <Col span={24}>
                                        <Typography.Title level={5}>{PaidDeadlineLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name='paidDeadlineDuration'
                                            label={SelectLabel}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Select
                                                defaultValue={initialValues.paidDeadlineDuration}
                                            >
                                                {options}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Row gutter={SMALL_ROW_GUTTERS}>
                                    <Col span={24}>
                                        <Typography.Title level={5}>{EmergencyDeadlineLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name='emergencyDeadlineDuration'
                                            label={SelectLabel}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Select
                                                defaultValue={initialValues.emergencyDeadlineDuration}
                                            >
                                                {options}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Row gutter={SMALL_ROW_GUTTERS}>
                                    <Col span={24}>
                                        <Typography.Title level={5}>{WarrantyDeadlineLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name='warrantyDeadlineDuration'
                                            label={SelectLabel}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Select
                                                defaultValue={initialValues.warrantyDeadlineDuration}
                                            >
                                                {options}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <ActionBar
                            actions={[
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='primary'
                                    loading={isLoading}
                                >
                                    {SaveMessage}
                                </Button>,
                            ]}
                        />
                    </Col>
                </Row>
            )}
        </FormWithAction>
    ), [DefaultDeadlineLabel, EmergencyDeadlineLabel, PaidDeadlineLabel, SelectLabel, WarrantyDeadlineLabel, getSuccessfulChangeNotification, initialValues, options, updateAction])

    if (loading || !ticketSetting) return null

    return settingsForm
}
