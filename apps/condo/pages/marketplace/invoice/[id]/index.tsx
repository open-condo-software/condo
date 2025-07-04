import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Alert, Button, Space, Tooltip, Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { PageComponentType } from '@condo/domains/common/types'
import { getObjectCreatedMessage } from '@condo/domains/common/utils/date.utils'
import { getAddressDetails } from '@condo/domains/common/utils/helpers'
import { CopyButton } from '@condo/domains/marketplace/components/Invoice/CopyButton'
import { InvoiceRowsTable } from '@condo/domains/marketplace/components/Invoice/InvoiceRowsTable'
import { InvoiceStatusSelect } from '@condo/domains/marketplace/components/Invoice/InvoiceStatusSelect'
import { ResidentPaymentAlert } from '@condo/domains/marketplace/components/Invoice/ResidentPaymentAlert'
import { InvoiceReadPermissionRequired } from '@condo/domains/marketplace/components/PageAccess'
import {
    INVOICE_STATUS_PAID,
    INVOICE_STATUS_CANCELED,
    INVOICE_STATUS_DRAFT,
} from '@condo/domains/marketplace/constants'
import { INVOICE_STATUS_PUBLISHED } from '@condo/domains/marketplace/constants'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'
import { TicketUserInfoField } from '@condo/domains/ticket/components/TicketId/TicketUserInfoField'
import { getSectionAndFloorByUnitName } from '@condo/domains/ticket/utils/unit.js'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { RESIDENT } from '@condo/domains/user/constants/common'


const INVOICE_CONTENT_VERTICAL_GUTTER: RowProps['gutter'] = [0, 60]
const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const SMALL_VERTICAL_GUTTER: RowProps['gutter'] = [0, 20]
const BIG_HORIZONTAL_GUTTER: RowProps['gutter'] = [40, 0]
const ELLIPSIS_CONFIG = { rows: 2 }

const InvoiceHeader = ({ invoice, title, refetchInvoice, employee }) => {
    const intl = useIntl()
    const InvoiceAuthorMessage = intl.formatMessage({ id: 'Author' })

    const InvoiceCreationDate = useMemo(() => getObjectCreatedMessage(intl, invoice), [intl, invoice])

    const { breakpoints } = useLayoutContext()

    const handleInvoiceStatusChanged = useCallback(() => {
        refetchInvoice()
    }, [refetchInvoice])

    const createdBy = useMemo(() => get(invoice, ['createdBy']), [invoice])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER} justify='space-between'>
            <Col md={12} xs={24}>
                <Row gutter={SMALL_VERTICAL_GUTTER} align='middle'>
                    <Col span={breakpoints.TABLET_LARGE ? 24 : 22}>
                        <Typography.Title level={1}>{title}</Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Row>
                            <Col span={24}>
                                <Typography.Text size='small'>
                                    <Typography.Text type='secondary' size='small'>
                                        {InvoiceCreationDate},&nbsp;{InvoiceAuthorMessage}
                                    </Typography.Text>
                                    <UserNameField user={createdBy}>
                                        {({ name, postfix }) => (
                                            <Typography.Text size='small'>
                                                &nbsp;{name}
                                                {postfix && (
                                                    <Typography.Text type='secondary' size='small' ellipsis>&nbsp;{postfix}</Typography.Text>
                                                )}
                                            </Typography.Text>
                                        )}
                                    </UserNameField>
                                </Typography.Text>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Col>
            <Col md={12} xs={24}>
                {
                    breakpoints.TABLET_LARGE ? (
                        <Row justify='end' gutter={SMALL_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Row justify='end' align='middle' gutter={BIG_HORIZONTAL_GUTTER}>
                                    <Col>
                                        <InvoiceStatusSelect
                                            employee={employee}
                                            invoice={invoice}
                                            onUpdate={handleInvoiceStatusChanged}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    ) : (
                        <Row gutter={SMALL_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <InvoiceStatusSelect
                                    employee={employee}
                                    invoice={invoice}
                                    onUpdate={handleInvoiceStatusChanged}
                                />
                            </Col>
                        </Row>
                    )
                }
            </Col>
        </Row>
    )
}

const InvoiceTicketAlert = ({ invoiceTicket }) => {
    const intl = useIntl()
    const AlertMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.ticketAlert.message' }, { number: invoiceTicket.number })
    const AlertDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.ticketAlert.description' })

    return (
        <Alert
            type='info'
            showIcon
            message={
                <Typography.Text>
                    {AlertMessage}
                </Typography.Text>
            }
            description={
                <Typography.Link
                    href={`/ticket/${invoiceTicket.id}`}
                    target='_blank'
                    size='large'
                >
                    {AlertDescription}
                </Typography.Link>
            }
        />
    )
}

const PaymentTypeField = ({ invoice, isTerminalStatus }) => {
    const intl = useIntl()
    const PaymentTypeMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.paymentType' })
    const PaymentTypeValue = intl.formatMessage({ id: `pages.condo.marketplace.invoice.form.payment.${invoice.paymentType}` as FormatjsIntl.Message['ids'] })
    const PaymentLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.paymentLink' })
    const CopyMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.paymentLink.copy' })
    const CopiedLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.copiedLink' })

    const [url, setUrl] = useState<string>()
    const getPaymentLink = useInvoicePaymentLink()

    useEffect(() => {
        if (invoice.status === INVOICE_STATUS_PUBLISHED) {
            getPaymentLink([invoice.id])
                .then(({ paymentLink }) => setUrl(paymentLink))
        }
    }, [getPaymentLink, invoice.id, invoice.status])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <PageFieldRow title={PaymentTypeMessage} ellipsis={ELLIPSIS_CONFIG}>
                {PaymentTypeValue}
            </PageFieldRow>
            {
                !isTerminalStatus && url && (
                    <PageFieldRow align='middle' title={PaymentLinkMessage} ellipsis={ELLIPSIS_CONFIG}>
                        <Row gutter={[36, 20]} align='middle'>
                            <Col xs={20} md={10} lg={13} xl={15} xxl={17}>
                                <Typography.Link href={url} title={url} ellipsis>{url}</Typography.Link>
                            </Col>
                            <Col>
                                <CopyButton
                                    textButton
                                    url={url}
                                    copyMessage={CopyMessage}
                                    copiedMessage={CopiedLinkMessage}
                                />
                            </Col>
                        </Row>
                    </PageFieldRow>
                )
            }
        </Row>
    )
}

const AddressField = ({ invoice }) => {
    const intl = useIntl()
    const FloorNameMessage = intl.formatMessage({ id: 'pages.condo.property.floor.Name' }).toLowerCase()

    const property = get(invoice, 'property')

    if (isEmpty(property)) {
        return <Typography.Text>—</Typography.Text>
    }

    const unitName = get(invoice, 'unitName')
    const unitType = get(invoice, 'unitType')
    const addressMeta = get(property, 'addressMeta')
    const UnitTypePrefix = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` as FormatjsIntl.Message['ids'] })
    const addressDetails = getAddressDetails({ addressMeta })
    const streetPart = get(addressDetails, 'streetPart')
    const renderPostfix = get(addressDetails, 'renderPostfix')
    const ticketUnitMessage = unitName ? `${UnitTypePrefix.toLowerCase()} ${invoice.unitName} ` : ''
    const { sectionName, floorName, sectionType } = getSectionAndFloorByUnitName(property, unitName, unitType)
    const SectionTypeMessage = intl.formatMessage({ id: `field.sectionType.${sectionType}` as FormatjsIntl.Message['ids'] }).toLowerCase()
    const SectionAndFloorMessage = `(${SectionTypeMessage} ${sectionName}, ${FloorNameMessage} ${floorName})`

    return (
        <Space size={4} direction='vertical'>
            <Typography.Text type='secondary'>
                {renderPostfix}
            </Typography.Text>
            <Link href={`/property/${get(invoice, 'property.id')}`}>
                <Typography.Link>
                    {streetPart}
                </Typography.Link>
            </Link>
            {
                unitName && (
                    <Typography.Paragraph>
                        <Typography.Text>{ticketUnitMessage}</Typography.Text>
                        {
                            sectionName && floorName && (
                                <Typography.Text>{SectionAndFloorMessage}</Typography.Text>
                            )
                        }
                    </Typography.Paragraph>
                )
            }
        </Space>
    )
}

const ClientField = ({ invoice }) => {
    const contactId = get(invoice, ['contact', 'id'])
    const clientName = get(invoice, 'clientName')
    const clientPhone = get(invoice, 'clientPhone')

    const contactUser = useMemo(() => ({
        name: get(invoice, ['contact', 'name']),
        phone: get(invoice, ['contact', 'phone']),
    }), [invoice])

    const clientUser = useMemo(() => ({
        name: clientName,
        phone: clientPhone,
    }), [clientName, clientPhone])

    if (!contactId || !(clientName && clientPhone)) {
        return <Typography.Text>—</Typography.Text>
    }

    return contactId
        ? <TicketUserInfoField
            user={contactUser}
            nameLink={`/contact/${contactId}`}
        />
        : <Typography.Text>
            <TicketUserInfoField
                user={clientUser}
            />
        </Typography.Text>
}

const PayerDataField = ({ invoice }) => {
    const intl = useIntl()
    const PayerDataMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.title.payerData' })
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.address' })
    const ContactMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.contact' })

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={4}>{PayerDataMessage}</Typography.Title>
            </Col>
            <PageFieldRow title={AddressMessage} ellipsis={ELLIPSIS_CONFIG}>
                <AddressField invoice={invoice} />
            </PageFieldRow>
            <PageFieldRow title={ContactMessage} ellipsis={ELLIPSIS_CONFIG}>
                <ClientField invoice={invoice} />
            </PageFieldRow>
        </Row>
    )
}


const InvoiceActionBar = ({
    invoice,
    employee,
}) => {
    const intl = useIntl()
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })

    const canManageInvoices = useMemo(() => get(employee, 'role.canManageInvoices'), [employee])
    const invoiceStatus = useMemo(() => get(invoice, 'status'), [invoice])
    const isButtonDisabled = invoiceStatus === INVOICE_STATUS_CANCELED ||
        invoiceStatus === INVOICE_STATUS_PUBLISHED || invoiceStatus === INVOICE_STATUS_PAID

    const DisabledTooltipMessage = useMemo(() => isButtonDisabled &&
        intl.formatMessage(
            { id: 'pages.condo.marketplace.invoice.id.disableEditButtonTooltip' },
        ), [isButtonDisabled, intl])

    return canManageInvoices && (
        <ActionBar
            actions={[
                <Link
                    key='update'
                    href={`/marketplace/invoice/${invoice.id}/update`}
                >
                    <Tooltip
                        title={DisabledTooltipMessage}
                    >
                        <span>
                            <Button
                                disabled={isButtonDisabled}
                                type='primary'
                                data-cy='invoice__update-link'
                            >
                                {UpdateMessage}
                            </Button>
                        </span>
                    </Tooltip>
                </Link>,
            ]}
        />
    )
}

const InvoiceIdPage: PageComponentType = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const RawInvoiceTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.update.title' })
    const OrderTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.title.order' })
    const NotFoundErrorTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.notFoundError.title' })
    const NotFoundDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.notFoundError.description' })

    const { link, isLoading: employeeLoading, organization } = useOrganization()
    const router = useRouter()
    const { query: { id } } = router as { query: { [key: string]: string } }

    const { refetch: refetchInvoice, loading: invoiceLoading, obj: invoice, error } = Invoice.useObject({
        where: {
            id,
            organization: { id: get(organization, 'id', null) },
        },
    })

    const InvoiceTitleMessage = RawInvoiceTitle.replace('{number}', String(get(invoice, 'number')))
    const loading = invoiceLoading || employeeLoading

    if (!invoice) {
        if (!error && !loading) {
            return (
                <LoadingOrErrorPage
                    title={NotFoundErrorTitle}
                    error={NotFoundDescription}
                />
            )
        }

        return (
            <LoadingOrErrorPage
                loading={loading}
                error={error && ServerErrorMessage}
            />
        )
    }

    const status = get(invoice, 'status')
    const propertyId = get(invoice, 'property.id')
    const unitType = get(invoice, 'unitType')
    const unitName = get(invoice, 'unitName')
    const clientPhone = get(invoice, 'clientPhone')
    const isCreatedByResident = get(invoice, 'createdBy.type') === RESIDENT
    const invoiceTicket = get(invoice, 'ticket')

    const isTerminalStatus = status === INVOICE_STATUS_PAID || status === INVOICE_STATUS_CANCELED
    const hasPayerData = propertyId && unitName && unitType && clientPhone

    return (
        <>
            <Head>
                <title>{InvoiceTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row>
                        <Col md={18} xs={24}>
                            <Row gutter={INVOICE_CONTENT_VERTICAL_GUTTER}>
                                <Col span={24}>
                                    <InvoiceHeader
                                        title={InvoiceTitleMessage}
                                        invoice={invoice}
                                        refetchInvoice={refetchInvoice}
                                        employee={link}
                                    />
                                </Col>
                                {
                                    invoiceTicket && (
                                        <Col span={24}>
                                            <InvoiceTicketAlert invoiceTicket={invoiceTicket} />
                                        </Col>
                                    )
                                }
                                <Col span={24}>
                                    <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                                        <Col span={24}>
                                            <Typography.Title level={4}>{OrderTitle}</Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <InvoiceRowsTable invoice={invoice} />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <PaymentTypeField
                                        invoice={invoice}
                                        isTerminalStatus={isTerminalStatus}
                                    />
                                </Col>
                                <Col span={24}>
                                    <PayerDataField invoice={invoice} />
                                </Col>
                                {
                                    hasPayerData && !isTerminalStatus && get(invoice, 'status') !== INVOICE_STATUS_DRAFT && (
                                        <Col span={24}>
                                            <ResidentPaymentAlert
                                                propertyId={propertyId}
                                                unitType={unitType}
                                                unitName={unitName}
                                                clientPhone={clientPhone}
                                                isCreatedByResident={isCreatedByResident}
                                            />
                                        </Col>
                                    )
                                }
                                <Col span={24}>
                                    <InvoiceActionBar
                                        invoice={invoice}
                                        employee={link}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

InvoiceIdPage.requiredAccess = InvoiceReadPermissionRequired

export default InvoiceIdPage
