import get from 'lodash/get'
import getConfig from 'next/config'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { upload as uploadFiles } from '@open-condo/files'
import type { UploadFileResult } from '@open-condo/files'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Alert } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { MediaUpload } from '@/domains/miniapp/components/MediaUpload'
import {
    DEFAULT_B2C_LOGO_URL,
    B2C_LOGO_SIZE,
    B2C_LOGO_MAIN_COLOR,
    B2C_LOGO_SECONDARY_COLOR,
    B2C_LOGO_ALLOWED_MIMETYPES,
    B2C_LOGO_MAX_FILE_SIZE_IN_BYTES,
} from '@/domains/miniapp/constants/common'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'
import { useAuth } from '@/domains/user/utils/auth'

import { B2CAppCard } from './B2CAppCard'

import type { PreviewRender, MediaRestrictions, SaveHandler } from '@/domains/miniapp/components/MediaUpload'

import { GetB2CAppDocument, useGetB2CAppQuery, useUpdateB2CAppMutation } from '@/gql'

const {
    publicRuntimeConfig: { serviceUrl, fileClientId },
} = getConfig()

const ICONS_STYLE_GUIDE_LINK = 'https://www.figma.com/file/kcIVFtPIEZCADGkqHGPoiW/B2C-mini-apps-%E2%80%94-guide-for-partners?type=design&node-id=980%3A410&mode=design&t=KufWfS9FTHDDl0xH-1'

export const IconsSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const MainIconTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.icons.items.main.title' })
    const MainIconDescription = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.icons.items.main.description' })
    const RulesWarningText = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.icons.warning.description' })

    const { user } = useAuth()
    const { data } = useGetB2CAppQuery({ variables: { id } })

    const name = get(data, ['app', 'name'], '') as string
    const logo = get(data, ['app', 'logo', 'publicUrl'], DEFAULT_B2C_LOGO_URL) as string

    const onCompleted = useMutationCompletedHandler()
    const onError = useMutationErrorHandler()
    const [updateB2CAppMutation] = useUpdateB2CAppMutation({
        refetchQueries: [
            {
                query: GetB2CAppDocument,
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
                    modelNames: ['B2CApp'],
                },
                attach: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    itemId: id,
                    modelName: 'B2CApp',
                },
            })
            files = uploadedFiles
        } catch (e) {
            onError(e)
            throw e
        }

        if (files.length) {
            const result = await updateB2CAppMutation({
                variables: {
                    id,
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        logo: files[0],
                    },
                },
            })
            if (result.errors?.length) throw result.errors[0]
        }
    }, [id, onError, updateB2CAppMutation, user?.id])

    const iconGuide = useMemo(() => ({
        url: ICONS_STYLE_GUIDE_LINK,
    }), [])

    const iconRestrictions: MediaRestrictions = useMemo(() => ({
        mimetypes: B2C_LOGO_ALLOWED_MIMETYPES,
        maxFileSize: B2C_LOGO_MAX_FILE_SIZE_IN_BYTES,
        size: { width: { min: B2C_LOGO_SIZE, max: B2C_LOGO_SIZE }, height: { min: B2C_LOGO_SIZE, max: B2C_LOGO_SIZE } },
        colors: [{ value: B2C_LOGO_MAIN_COLOR, textColor: 'white' }, { value: B2C_LOGO_SECONDARY_COLOR, textColor: 'black' }],
    }), [])

    const iconPreview: PreviewRender = useCallback((items) => {
        const logoUrl = items[0]?.previewUrl ?? logo ?? DEFAULT_B2C_LOGO_URL
        return <B2CAppCard logo={logoUrl} name={name} />
    }, [logo, name])

    return (
        <MediaUpload
            formName='update-b2c-app-icons-form'
            title={MainIconTitle}
            description={MainIconDescription}
            renderPreview={iconPreview}
            restrictions={iconRestrictions}
            maxFiles={1}
            onSave={handleIconSave}
            warning={(
                <Alert
                    showIcon
                    type='warning'
                    description={RulesWarningText}
                />
            )}
            guide={iconGuide}
        />
    )
}