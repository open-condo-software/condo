import { useCreateNewsItemFileMutation, useGetNewsItemFilesLazyQuery } from '@app/condo/gql'
import { CreateNewsItemFileMutation } from '@app/condo/gql/operation.types'
import getConfig from 'next/config'
import { useCallback, useMemo, useState } from 'react'

import { buildMeta, upload as uploadFiles } from '@open-condo/files'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


const { publicRuntimeConfig: { fileClientId } = {} } = getConfig()

const FILE_UPLOAD_MODEL = 'NewsItemFile'

export const useReuploadNewsItemFiles = () => {
    const { user } = useAuth()
    const { organization } = useOrganization()

    const [createNewsItemFile] = useCreateNewsItemFileMutation()
    const [getNewsItemFiles] = useGetNewsItemFilesLazyQuery()

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [reuploadedNewsItemFiles, setReuploadedNewsItemFiles] = useState<Array<CreateNewsItemFileMutation['newsItemFile']>>(null)

    const reuploadNewsItemFile = useCallback(async (url: string, fileName: string, mimetype: string): Promise<NonNullable<CreateNewsItemFileMutation['newsItemFile']>> => {
        if (!fileClientId || !user?.id || !organization?.id) return

        const response = await fetch(url)

        if (!response.ok) {
            throw new Error('Cannot download file!')
        }

        const blob = await response.blob()

        const fileToUpload = new File(
            [blob],
            fileName,
            { type: mimetype }
        )

        const sender = getClientSideSenderInfo()
        const dvAndSender = { dv: 1, sender }

        const uploadResult = await uploadFiles({
            files: [fileToUpload],
            meta: buildMeta({
                userId: user.id,
                fileClientId,
                modelNames: [FILE_UPLOAD_MODEL],
                fingerprint: sender.fingerprint,
                organizationId: organization?.id,
            }),
        })
        const createInput = {
            signature: uploadResult.files?.[0]?.signature,
            originalFilename: fileName,
            mimetype: mimetype,
        }

        const dbFile = await createNewsItemFile({
            variables: {
                data: {
                    ...dvAndSender,
                    file: createInput,
                },
            },
        })

        return dbFile?.data?.newsItemFile
    }, [createNewsItemFile, organization?.id, user?.id])

    const reuploadFiles = useCallback(async (newsItemId: string) => {
        if (!newsItemId) return
        if (isLoading) return

        setIsLoading(true)
        const newsItemFiles = await getNewsItemFiles({
            variables: {
                where: {
                    newsItem: { id: newsItemId },
                },
            },
        })

        const files = newsItemFiles?.data?.newsItemFiles?.filter(Boolean)?.map((newsItemFile) => newsItemFile?.file).filter(Boolean)

        const reuploadedNewsItemFiles = await Promise.all(
            files.map((file) => reuploadNewsItemFile(file.publicUrl, file.originalFilename, file.mimetype))
        )

        const result = reuploadedNewsItemFiles.filter(Boolean)

        setReuploadedNewsItemFiles(result)
        setIsLoading(false)

        return result
    }, [getNewsItemFiles, isLoading, reuploadNewsItemFile])

    return useMemo(() => ({
        isLoading,
        reuploadedNewsItemFiles,
        reuploadFiles,
    }), [isLoading, reuploadFiles, reuploadedNewsItemFiles])
}
