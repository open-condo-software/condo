import { Col, Row } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import type { UploadFileResult } from '@open-condo/files'
import { upload as uploadFiles } from '@open-condo/files'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'
import { useAuth } from '@/domains/user/utils/auth'

import { B2BAppCard } from './B2BAppCard'
import { MediaUpload } from './MediaUpload'

import type { MediaRestrictions, PreviewRender, SaveHandler } from './MediaUpload'
import type { RowProps } from 'antd'

import { GetB2BAppDocument, useGetB2BAppQuery, useUpdateB2BAppMutation } from '@/gql'

const {
    publicRuntimeConfig: { serviceUrl, fileClientId },
} = getConfig()

const MEDIA_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_SPAN_COL = 24

export const MediaSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const MainIconTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.media.items.main.title' })
    const MainIconDescription = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.media.items.main.description' })

    const { data } = useGetB2BAppQuery({ variables: { id } })
    const { user } = useAuth()

    const mainIconRestrictions: MediaRestrictions = useMemo(() => ({
        mimetypes: ['image/webp', 'image/png'],
        maxFileSize: 1024 * 1024 * 2,
    }), [])

    const logoPreview: PreviewRender = useCallback((items) => {
        const logoUrl = items[0]?.previewUrl
        return <B2BAppCard img={logoUrl ?? data?.app?.logo?.publicUrl} title={data?.app?.name ?? ''} description={data?.app?.shortDescription} />
    }, [data?.app?.logo?.publicUrl, data?.app?.name, data?.app?.shortDescription])

    const onError = useMutationErrorHandler()
    const onCompleted = useMutationCompletedHandler()
    const [updateB2CAppMutation] = useUpdateB2BAppMutation({
        refetchQueries: [
            {
                query: GetB2BAppDocument,
                variables: { id },
            },
        ],
        onError,
        onCompleted,
    })
    const handleIconSave: SaveHandler = useCallback(async (uploadedFiles) => {
        if (!uploadedFiles.length || !user?.id) return
        const fileObj = uploadedFiles[0].originFileObj
        if (!fileObj) return

        let files: Array<UploadFileResult> = []

        try {
            const { files: uploadedFiles } = await uploadFiles({
                serverUrl: serviceUrl,
                files: [fileObj],
                meta: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    user: { id: user.id },
                    fileClientId,
                    modelNames: ['B2BApp'],
                },
                attach: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    itemId: id,
                    modelName: 'B2BApp',
                },
            })
            files = uploadedFiles
        } catch (e) {
            onError(e)
            return
        }

        if (files.length) {
            await updateB2CAppMutation({
                variables: {
                    id,
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        logo: files[0],
                    },
                },
            })
        }
    }, [id, onError, updateB2CAppMutation, user?.id])

    return (
        <Row gutter={MEDIA_GUTTER}>
            <Col span={FULL_SPAN_COL}>
                <MediaUpload
                    formName='update-b2b-app-logo-form'
                    title={MainIconTitle}
                    description={MainIconDescription}
                    restrictions={mainIconRestrictions}
                    maxFiles={1}
                    renderPreview={logoPreview}
                    onSave={handleIconSave}
                />
            </Col>
        </Row>
    )
}