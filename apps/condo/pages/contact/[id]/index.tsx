import {
    useGetContactByIdQuery,
    useUpdateContactMutation,
    GetContactByIdQuery,
} from '@app/condo/gql'
import { BuildingUnitSubType, Organization } from '@app/condo/schema'
import { Col, Row } from 'antd'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Typography, Checkbox } from '@open-condo/ui'

import { PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { FieldPairRow as BaseFieldPairRow, FieldPairRowProps } from '@condo/domains/common/components/FieldPairRow'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { TicketCardList } from '@condo/domains/common/components/TicketCard/TicketCardList'
import { PageComponentType } from '@condo/domains/common/types'
import { ContactsReadPermissionRequired } from '@condo/domains/contact/components/PageAccess'
import { prefetchContact } from '@condo/domains/contact/utils/next/Contact'


const VALUE_FIELD_WRAPPER_STYLE = { width: '100%' }
const CONTACT_FIELD_PAIR_PROPS: Partial<FieldPairRowProps> = {
    titleColProps: { span: 8 },
    valueColProps: { span: 16, style: VALUE_FIELD_WRAPPER_STYLE },
}

const FieldPairRow: React.FC<FieldPairRowProps> = (props) => (
    <BaseFieldPairRow
        {...CONTACT_FIELD_PAIR_PROPS}
        {...props}
    />
)

export const ContactPageContent = ({ contact, isContactEditable, softDeleteAction, organizationPhonePrefix = null }: {
    contact: GetContactByIdQuery['contacts'][0]
    isContactEditable: boolean
    softDeleteAction: () => Promise<void>
    organizationPhonePrefix?: Organization['phoneNumberPrefix']
}) => {
    const intl = useIntl()
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const ConfirmDeleteButtonLabel = intl.formatMessage({ id: 'Delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'contact.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'contact.ConfirmDeleteMessage' })
    const ContactRoleTitle = intl.formatMessage({ id: 'ContactRole' })
    const VerifiedMessage = intl.formatMessage({ id: 'pages.condo.contact.Verified' })
    const HasResident = intl.formatMessage({ id: 'pages.condo.contact.HasResident' })
    const DownloadApp = intl.formatMessage({ id: 'pages.condo.contact.DownloadApp' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const UnitTypeMessage = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${contact?.unitType || BuildingUnitSubType.Flat}` as FormatjsIntl.Message['ids'] })

    const contactId = useMemo(() => contact?.id ?? null, [contact])
    const contactName = useMemo(() => contact?.name ?? '', [contact])
    const contactEmail = useMemo(() => contact?.email ?? '', [contact])
    const contactPhone = useMemo(() => contact?.phone ?? '', [contact])
    const contactUnitName = useMemo(() => contact?.unitName ?? '', [contact])
    const unitSuffix = useMemo(() => contactUnitName ? `${UnitTypeMessage.toLowerCase()} ${contactUnitName}` : '', [UnitTypeMessage, contactUnitName])
    const contactAddress = useMemo(() => `${contact?.property?.address ?? DeletedMessage} ${unitSuffix}`, [contact, DeletedMessage, unitSuffix])
    const contactRoleName = useMemo(() => contact?.role?.name ?? '—', [contact])
    const isVerified = useMemo(() => contact?.isVerified, [contact])
    const hasResident = useMemo(() => contact?.hasResident, [contact])
    const phonePrefix = useMemo(() => organizationPhonePrefix ?? '', [organizationPhonePrefix])

    const { breakpoints } = useLayoutContext()

    return (
        <>
            <Head>
                <title>{contactName}</title>
            </Head>
            <PageWrapper>
                <Row gutter={[0, 20]} align='middle'>
                    <Col lg={18}>
                        <Row gutter={[0, 60]}>
                            <Typography.Title>
                                {contactName}
                            </Typography.Title>
                            <FrontLayerContainer>
                                <Row gutter={[0, 24]}>
                                    <FieldPairRow
                                        fieldTitle={AddressLabel}
                                        fieldValue={contactAddress}
                                    />
                                    <FieldPairRow
                                        fieldTitle={PhoneLabel}
                                        fieldValue={contactPhone}
                                        href={`tel:${phonePrefix ?
                                            `${phonePrefix}${contactPhone}` : contactPhone}`}
                                    />
                                    {
                                        contactEmail && <FieldPairRow
                                            fieldTitle={EmailLabel}
                                            fieldValue={contactEmail}
                                            href={`mailto:${contactEmail}`}
                                        />
                                    }
                                    <FieldPairRow
                                        fieldTitle={ContactRoleTitle}
                                        fieldValue={contactRoleName}
                                    />
                                    <>
                                        <Col span={8}>
                                            <Typography.Text type='secondary'>
                                                {VerifiedMessage}
                                            </Typography.Text>
                                        </Col>
                                        <Col span={16}>
                                            <Checkbox
                                                checked={isVerified}
                                                disabled={!isVerified}
                                            />
                                        </Col>
                                    </>
                                    <FieldPairRow
                                        fieldTitle={HasResident}
                                        fieldValue={hasResident ? DownloadApp : '—'}
                                    />
                                </Row>
                            </FrontLayerContainer>
                            {isContactEditable && breakpoints.DESKTOP_SMALL && (
                                <Col span={16}>
                                    <ActionBar
                                        actions={[
                                            <Link key='update' href={`/contact/${contact?.id}/update`}>
                                                <Button
                                                    type='primary'
                                                >
                                                    {UpdateMessage}
                                                </Button>
                                            </Link>,
                                            <DeleteButtonWithConfirmModal
                                                key='delete'
                                                title={ConfirmDeleteTitle}
                                                message={ConfirmDeleteMessage}
                                                okButtonLabel={ConfirmDeleteButtonLabel}
                                                action={softDeleteAction}
                                                buttonContent={DeleteMessage}
                                            />,
                                        ]}
                                    />
                                </Col>
                            )}
                        </Row>
                    </Col>
                    <Col xs={24} sm={24} lg={6}>
                        <TicketCardList
                            contactId={contactId}
                        />
                    </Col>
                    {isContactEditable && !breakpoints.DESKTOP_SMALL && (
                        <Col span={24}>
                            <ActionBar
                                actions={[
                                    <Link key='update' href={`/contact/${contactId}/update`}>
                                        <Button
                                            type='primary'
                                        >
                                            {UpdateMessage}
                                        </Button>
                                    </Link>,
                                    <DeleteButtonWithConfirmModal
                                        key='delete'
                                        title={ConfirmDeleteTitle}
                                        message={ConfirmDeleteMessage}
                                        okButtonLabel={ConfirmDeleteButtonLabel}
                                        action={softDeleteAction}
                                        buttonContent={DeleteMessage}
                                    />,
                                ]}
                            />
                        </Col>
                    )}
                </Row>
            </PageWrapper>
        </>
    )
}

const ContactInfoPage: PageComponentType = () => {
    const intl = useIntl()
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const ContactNotFoundTitle = intl.formatMessage({ id: 'Contact.NotFound.Title' })
    const ContactNotFoundMessage = intl.formatMessage({ id: 'Contact.NotFound.Message' })

    const { push, query } = useRouter()
    const { id: contactId } = query as { id: string }
    const { role } = useOrganization()
    const { persistor } = useCachePersistor()

    const {
        data,
        loading,
        error,
    } = useGetContactByIdQuery({
        variables: { id: contactId },
        skip: !persistor,
    })
    const filteredContacts = data?.contacts?.filter(Boolean)
    const contact = Array.isArray(filteredContacts) && filteredContacts.length > 0 ? filteredContacts[0] : null
    const contactLoading = useMemo(() => loading || !persistor, [loading, persistor])

    const [updateContactMutation] = useUpdateContactMutation({
        variables: {
            id: contactId,
            data: {
                deletedAt: new Date().toISOString(),
                sender: getClientSideSenderInfo(),
                dv: 1,
            },
        },
    })

    const handleDeleteAction = useCallback(async () => {
        await updateContactMutation()
        await push('/contact')
    }, [push, updateContactMutation])

    if (error || contactLoading) {
        return <LoadingOrErrorPage title={LoadingMessage} loading={contactLoading} error={error ? ErrorMessage : null}/>
    }
    if (!contact) {
        return <LoadingOrErrorPage title={ContactNotFoundTitle} loading={false} error={ContactNotFoundMessage}/>
    }

    const isContactEditable = role?.canManageContacts

    return (
        <ContactPageContent
            contact={contact}
            isContactEditable={isContactEditable}
            softDeleteAction={handleDeleteAction}
        />
    )
}

ContactInfoPage.requiredAccess = ContactsReadPermissionRequired

ContactInfoPage.getPrefetchedData = async ({ context, apolloClient }) => {
    const { query } = context
    const { id: contactId } = query as { id: string }

    await prefetchContact({ client: apolloClient, contactId })

    return {
        props: {},
    }
}

export default ContactInfoPage
