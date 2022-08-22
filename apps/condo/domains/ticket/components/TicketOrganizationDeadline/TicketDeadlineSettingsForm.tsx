import React, { useCallback, useMemo } from 'react'
import get from 'lodash/get'
import { Col, Form, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'

import { useIntl } from '@condo/next/intl'
import { useOrganization } from '@condo/next/organization'
import { MAX_TICKET_DEADLINE, MIN_TICKET_DEADLINE } from '@condo/domains/ticket/constants/common'
import Select from '@condo/domains/common/components/antd/Select'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { Button } from '@condo/domains/common/components/Button'
import { TicketOrganizationSetting as TicketSetting } from '@condo/domains/ticket/utils/clientSchema'
import { humanizeDays } from '@condo/domains/common/utils/helpers'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 6,
    },
    wrapperCol: {
        span: 10,
    },
    styled: {
        paddingBottom: '12px',
    },
    colon: false,
}
const BIG_ROW_GUTTERS: [Gutter, Gutter] = [0, 60]
const MIDDLE_ROW_GUTTERS: [Gutter, Gutter] = [0, 40]
const SMALL_ROW_GUTTERS: [Gutter, Gutter] = [0, 20]

export const TicketDeadlineSettingsForm: React.FC = () => {
    const intl = useIntl()
    const OptionWithoutDeadlineLabel = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.options.withoutDeadline' })
    const OptionCurrentDateLabel = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.options.currentDate' })
    const DefaultDeadlineLabel = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.defaultDeadline.label' })
    const PaidDeadlineLabel = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.paidDeadline.label' })
    const EmergencyDeadlineLabel = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.emergencyDeadline.label' })
    const WarrantyDeadlineLabel = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.warrantyDeadline.label' })
    const SelectLabel = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.select.label' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const { obj: ticketSetting, loading } = TicketSetting.useObject({
        where: {
            organization: { id: userOrganizationId },
        },
    })

    const action = TicketSetting.useUpdate({})
    const updateAction = useCallback((value) => action(value, ticketSetting), [action, ticketSetting])

    const options = useMemo(() => {
        const range = new Array(MAX_TICKET_DEADLINE - MIN_TICKET_DEADLINE + 1 + 1).fill(1)
        return range.map((item, index) => {
            const value = index === range.length - 1 ? null : index

            let label
            if (index === 0) label = `+${humanizeDays(index)} (${OptionCurrentDateLabel})`
            else if (index === range.length - 1) label = OptionWithoutDeadlineLabel
            else label = `+${humanizeDays(index)}`

            return <Select.Option value={value} key={value}>{label}</Select.Option>
        })
    }, [OptionCurrentDateLabel, OptionWithoutDeadlineLabel])

    const settingsForm = useMemo(() => (
        <FormWithAction
            initialValues={ticketSetting}
            action={updateAction}
            colon={false}
            layout='horizontal'
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
                                            name='defaultDeadline'
                                            label={SelectLabel}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Select
                                                defaultValue={ticketSetting.defaultDeadline}
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
                                            name='paidDeadline'
                                            label={SelectLabel}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Select
                                                defaultValue={ticketSetting.paidDeadline}
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
                                            name='emergencyDeadline'
                                            label={SelectLabel}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Select
                                                defaultValue={ticketSetting.emergencyDeadline}
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
                                            name='warrantyDeadline'
                                            label={SelectLabel}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Select
                                                defaultValue={ticketSetting.warrantyDeadline}
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
                        <Button
                            key='submit'
                            onClick={handleSave}
                            type='sberDefaultGradient'
                            loading={isLoading}
                        >
                            Сохранить
                        </Button>
                    </Col>
                </Row>
            )}
        </FormWithAction>
    ), [DefaultDeadlineLabel, EmergencyDeadlineLabel, PaidDeadlineLabel, SelectLabel, WarrantyDeadlineLabel, options, ticketSetting, updateAction])

    if (loading || !ticketSetting) return null

    return <>{settingsForm}</>
}
