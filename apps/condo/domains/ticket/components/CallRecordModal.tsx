import { Col, Row, RowProps } from 'antd'
import difference from 'lodash/difference'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { Download } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal, Button, Typography, Space } from '@open-condo/ui'

import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { getAddressRender } from '@condo/domains/common/components/Table/Renders'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'
import { CallRecordFragment } from '@condo/domains/ticket/utils/clientSchema'
import { getOrganizationTickets } from '@condo/domains/ticket/utils/clientSchema/search'

import { CallRecordCard } from './CallRecordCard'


const DROPDOWN_POPUP_CONTAINER_ID = 'attach-tickets-to-call-record'
function getPopupContainer (): HTMLElement {
    if (typeof document !== 'undefined') {
        return document.getElementById(DROPDOWN_POPUP_CONTAINER_ID)
    }
}

const MAIN_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const RECORD_INFO_ROW_GUTTER: RowProps['gutter'] = [0, 24]
const CALL_RECORD_ROW_GUTTER: RowProps['gutter'] = [0, 16]
const ATTACH_TICKETS_ROW_GUTTER: RowProps['gutter'] = [0, 20]

const TICKETS_SELECT_STYLE: CSSProperties = { width: '100%' }

export const CallRecordModal = ({ selectedCallRecordFragment, setSelectedCallRecordFragment, refetchFragments, autoPlay }) => {
    const intl = useIntl()
    const IncomingCallMessage = intl.formatMessage({ id: 'callRecord.callType.incoming' })
    const OutgoingCallMessage = intl.formatMessage({ id: 'callRecord.callType.outgoing' })
    const CallMessage = intl.formatMessage({ id: 'callRecord.call' }).toLowerCase()
    const EmptyClientMessage = intl.formatMessage({ id: 'callRecord.modal.emptyClient' })
    const EmptyAddressMessage = intl.formatMessage({ id: 'callRecord.modal.emptyAddress' })
    const DownloadCallRecordMessage = intl.formatMessage({ id: 'callRecord.downloadRecord' })
    const AttachTicketsMessage = intl.formatMessage({ id: 'callRecord.modal.attachTicketsToCall' })
    const AttachTicketsPlaceholder = intl.formatMessage({ id: 'callRecord.modal.attachTicketsToCall.placeholder' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const userOrganization = useOrganization()
    const canDownloadCallRecords = useMemo(() => get(userOrganization, ['link', 'role', 'canDownloadCallRecords']), [userOrganization])

    const callRecordId = get(selectedCallRecordFragment, 'callRecord.id', null)
    const { objs: initialCallRecordFragments, loading } = CallRecordFragment.useObjects({
        where: {
            callRecord: { id: callRecordId },
        },
    })
    const softDeleteCallRecordFragment = CallRecordFragment.useSoftDelete(() => refetchFragments())
    const updateCallRecordFragment = CallRecordFragment.useUpdate({}, () => refetchFragments())
    const createCallRecordFragment = CallRecordFragment.useCreate({
        callRecord: { connect: { id: callRecordId } },
    }, () => refetchFragments())

    const initialAttachedTickets = useMemo(() => initialCallRecordFragments
        .map(fragment => get(fragment, 'ticket.id'))
        .filter(Boolean), [initialCallRecordFragments])

    const [attachedTickets, setAttachedTickets] = useState<string[]>([])

    useDeepCompareEffect(() => {
        if (!loading) {
            setAttachedTickets(initialAttachedTickets)
        }
    }, [initialAttachedTickets, loading])

    const handleAttachTicket = useCallback((ticketIds) => {
        setAttachedTickets(ticketIds)
    }, [])

    const resetAttachedTickets = useCallback(() => {
        setSelectedCallRecordFragment(null)
        setAttachedTickets([])
    }, [setSelectedCallRecordFragment])

    const handleSave = useCallback(() => {
        const removedTickets = difference(initialAttachedTickets, attachedTickets)
        const newAttachedTickets = difference(attachedTickets, initialAttachedTickets)

        removedTickets.forEach((ticketId, index) => {
            const callRecordFragment = initialCallRecordFragments
                .find(fragment => get(fragment, 'ticket.id') === ticketId)
            if (!callRecordFragment) return

            const emptyCallRecordFragment = initialCallRecordFragments
                .find(fragment =>
                    get(fragment, 'callRecord.id') === callRecordId &&
                    isEmpty(get(fragment, 'ticket'))
                )

            if (
                index === 0 &&
                removedTickets.length === initialAttachedTickets.length &&
                isEmpty(newAttachedTickets) &&
                !emptyCallRecordFragment
            ) {
                return updateCallRecordFragment({ ticket: { disconnect: { id: ticketId } } }, callRecordFragment)
            }

            return softDeleteCallRecordFragment(callRecordFragment)
        })

        newAttachedTickets.forEach((ticketId, index) => {
            if (index === 0 && isEmpty(initialAttachedTickets)) {
                const emptyCallRecordFragment = initialCallRecordFragments
                    .find(fragment => get(fragment, 'callRecord.id') === callRecordId)

                if (emptyCallRecordFragment) {
                    return updateCallRecordFragment({ ticket: { connect: { id: ticketId } } }, emptyCallRecordFragment)
                }
            }

            return createCallRecordFragment({
                callRecord: { connect: { id: callRecordId } },
                ticket: { connect: { id: ticketId } },
                startedAt: get(selectedCallRecordFragment, 'startedAt'),
            })
        })

        resetAttachedTickets()
    }, [attachedTickets, callRecordId, createCallRecordFragment, initialAttachedTickets,
        initialCallRecordFragments, resetAttachedTickets, selectedCallRecordFragment, softDeleteCallRecordFragment, updateCallRecordFragment])

    const closeModal = useCallback(() => {
        resetAttachedTickets()
    }, [resetAttachedTickets])

    const { downloadFile } = useDownloadFileFromServer()

    const url = get(selectedCallRecordFragment, 'callRecord.file.publicUrl')
    const name = get(selectedCallRecordFragment, 'callRecord.file.originalFilename')
    const handleDownloadFile = () => {
        downloadFile({ url, name })
    }

    if (!selectedCallRecordFragment || loading) {
        return null
    }

    const { callRecord, ticket } = selectedCallRecordFragment
    const organizationId = get(callRecord, 'organization.id')
    const Title = `${callRecord.isIncomingCall ? IncomingCallMessage : OutgoingCallMessage} ${CallMessage}`
    const clientName = get(ticket, 'clientName') || EmptyClientMessage
    const property = get(ticket, 'property') || EmptyAddressMessage

    return (
        <Modal
            open={!!selectedCallRecordFragment}
            onCancel={closeModal}
            destroyOnClose
            footer={[
                <Button
                    key='submit'
                    type='primary'
                    onClick={handleSave}
                >
                    {SaveLabel}
                </Button>,
            ]}
            title={Title}
            width='big'
        >
            <Row gutter={MAIN_ROW_GUTTER}>
                <Col span={24}>
                    <Row gutter={RECORD_INFO_ROW_GUTTER}>
                        <Col span={24}>
                            <Space size={12} direction='vertical'>
                                <Typography.Title level={4}>{clientName}</Typography.Title>
                                <Typography.Paragraph size='medium'>
                                    {getAddressRender(property, null, null, true)}
                                </Typography.Paragraph>
                            </Space>
                        </Col>
                        <Col span={24}>
                            <Row gutter={CALL_RECORD_ROW_GUTTER}>
                                <Col span={24}>
                                    <CallRecordCard
                                        callRecord={callRecord}
                                        autoPlay={autoPlay}
                                    />
                                </Col>
                                {
                                    canDownloadCallRecords && (
                                        <Col span={24}>
                                            <Typography.Link size='large' onClick={handleDownloadFile}>
                                                <Space size={8}>
                                                    <Download size='medium' />
                                                    {DownloadCallRecordMessage}
                                                </Space>
                                            </Typography.Link>
                                        </Col>
                                    )
                                }
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Row gutter={ATTACH_TICKETS_ROW_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={4}>{AttachTicketsMessage}</Typography.Title>
                        </Col>
                        <Col span={24} id={DROPDOWN_POPUP_CONTAINER_ID}>
                            <GraphQlSearchInput
                                style={TICKETS_SELECT_STYLE}
                                mode='multiple'
                                placeholder={AttachTicketsPlaceholder}
                                search={getOrganizationTickets(organizationId)}
                                getPopupContainer={getPopupContainer}
                                initialValue={initialAttachedTickets}
                                value={attachedTickets}
                                onChange={handleAttachTicket}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Modal>
    )
}
