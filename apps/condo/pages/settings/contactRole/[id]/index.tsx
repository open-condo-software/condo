import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import {
    DeleteButtonWithConfirmModal,
    IDeleteActionButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { SETTINGS_TAB_CONTACT_ROLES } from '@condo/domains/common/constants/settingsTabs'
import { ContactRole } from '@condo/domains/contact/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

const DELETE_BUTTON_CUSTOM_PROPS: IDeleteActionButtonWithConfirmModal['buttonCustomProps'] = {
    type: 'sberDangerGhost',
}

const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]
const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]

const TheContactRolePage = (): JSX.Element => {
    const intl = useIntl()
    const contactRoleTitleMessage = intl.formatMessage({ id: 'ContactRole' })
    const NameMessage = intl.formatMessage({ id: 'ContactRoles.name' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'ContactRoles.confirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'ContactRoles.confirmDeleteMessage' })

    const router = useRouter()
    const { link } = useOrganization()
    const canManageContacts = useMemo(() => get(link, ['role', 'canManageContacts']), [link])

    const contactRoleId = get(router, ['query', 'id'], null)
    const { loading, obj: contactRole } = ContactRole.useObject({
        where: { id: contactRoleId },
    })

    const handleDeleteAction = ContactRole.useSoftDelete(() => router.push(`/settings?tab=${SETTINGS_TAB_CONTACT_ROLES}`))

    const contactRoleName = useMemo(() => get(contactRole, 'name'), [contactRole])

    const handleDeleteButtonClick = useCallback(async () => {
        await handleDeleteAction(contactRole)
    }, [handleDeleteAction, contactRole])

    const deleteButtonContent = useMemo(() => <span>{DeleteMessage}</span>, [DeleteMessage])

    if (loading) {
        return <Loader/>
    }

    return (
        <>
            <Head>
                <title>{contactRoleTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={BIG_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Typography.Title>{contactRoleTitleMessage}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                                <Col span={24}>
                                    <PageFieldRow title={NameMessage}>
                                        {contactRoleName}
                                    </PageFieldRow>
                                </Col>
                            </Row>
                        </Col>
                        {
                            canManageContacts && (
                                <Col span={24}>
                                    <ActionBar>
                                        <Link href={`/settings/contactRole/${contactRoleId}/update`}>
                                            <Button
                                                color={'green'}
                                                type={'sberDefaultGradient'}
                                            >
                                                {UpdateMessage}
                                            </Button>
                                        </Link>
                                        <DeleteButtonWithConfirmModal
                                            title={ConfirmDeleteTitle}
                                            message={ConfirmDeleteMessage}
                                            okButtonLabel={DeleteMessage}
                                            action={handleDeleteButtonClick}
                                            buttonCustomProps={DELETE_BUTTON_CUSTOM_PROPS}
                                            buttonContent={deleteButtonContent}
                                        />
                                    </ActionBar>
                                </Col>
                            )
                        }
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TheContactRolePage.requiredAccess = OrganizationRequired

export default TheContactRolePage
