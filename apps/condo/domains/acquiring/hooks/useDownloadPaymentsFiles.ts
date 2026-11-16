import { useApolloClient } from '@apollo/client'
import {
    useGetPaymentsFilesLazyQuery,
    useUpdatePaymentsFileMutation,
} from '@app/condo/gql'
import { PaymentsFileStatusType } from '@app/condo/schema'
import JSZip from 'jszip'
import { useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'

import {
    getRedirectUrl,
    useDownloadFileFromServer,
} from '@condo/domains/common/hooks/useDownloadFileFromServer'


const ERROR_DOWNLOAD_FILE = 'Failed to download file'

const fetchFileBlob = async (url: string): Promise<Blob> => {
    const firstResponse = await fetch(url, {
        credentials: 'include',
        headers: {
            'shallow-redirect': 'true',
        },
    })
    if (!firstResponse.ok) throw new Error(ERROR_DOWNLOAD_FILE)

    const redirectUrl = await getRedirectUrl(firstResponse)
    if (!redirectUrl) return firstResponse.blob()

    const secondResponse = await fetch(redirectUrl)
    if (!secondResponse.ok) throw new Error(ERROR_DOWNLOAD_FILE)

    return secondResponse.blob()
}

const downloadBlob = (blob: Blob, name: string): void => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

const getUniqueFileName = (name: string, usedNames: Set<string>): string => {
    if (!usedNames.has(name)) {
        usedNames.add(name)
        return name
    }

    const extensionIndex = name.lastIndexOf('.')
    const baseName = extensionIndex > 0 ? name.slice(0, extensionIndex) : name
    const extension = extensionIndex > 0 ? name.slice(extensionIndex) : ''
    let index = 2
    let uniqueName = `${baseName}_${index}${extension}`

    while (usedNames.has(uniqueName)) {
        index += 1
        uniqueName = `${baseName}_${index}${extension}`
    }

    usedNames.add(uniqueName)
    return uniqueName
}


export default function useDownloadPaymentsFiles (refetch) {
    const { downloadFile } = useDownloadFileFromServer()
    const client = useApolloClient()

    const [getPaymentsFiles] = useGetPaymentsFilesLazyQuery()

    const [updatePaymentsFileMutation] = useUpdatePaymentsFileMutation({
        onCompleted: () => {
            refetch()
            client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allPaymentsFiles' })
        },
    })

    const updatePaymentsFileStatus = useCallback(async (id) => {
        await updatePaymentsFileMutation({
            variables: {
                id,
                data: {
                    status: PaymentsFileStatusType.Downloaded,
                    sender: getClientSideSenderInfo(),
                    dv: 1,
                },
            },
        })
    }, [updatePaymentsFileMutation])

    const downloadPaymentsFiles = async (selectedPaymentsFilesIds) => {
        if (!selectedPaymentsFilesIds || !Array.isArray(selectedPaymentsFilesIds)) {
            console.error('Invalid selectedPaymentsFilesIds parameter')
            return
        }
        const { data } = await getPaymentsFiles({
            variables: {
                where: {
                    id_in: selectedPaymentsFilesIds,
                },
                first: selectedPaymentsFilesIds.length,
            },
        })

        const selectedFiles = data?.paymentsFiles?.filter(Boolean) || []

        if (selectedFiles.length === 0) {
            console.warn('No files selected for download')
            return
        }

        if (selectedFiles.length === 1) {
            const file = selectedFiles[0]
            const url = file?.file?.publicUrl
            const name = file?.file?.originalFilename

            if (url && name) {
                await downloadFile({ url, name })
                await updatePaymentsFileStatus(file.id)
            } else {
                console.error('No files selected for download')
            }
        } else {
            const zip = new JSZip()
            const usedNames = new Set<string>()

            await Promise.all(selectedFiles.map(async (file) => {
                const url = file?.file?.publicUrl
                const name = file?.file?.originalFilename
                if (!url || !name) throw new Error(ERROR_DOWNLOAD_FILE)

                const blob = await fetchFileBlob(url)
                zip.file(getUniqueFileName(name, usedNames), blob)
            }))

            const zipBlob = await zip.generateAsync({ type: 'blob' })
            const archiveTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
            downloadBlob(zipBlob, `payments_files_${archiveTimestamp}.zip`)
            await Promise.all(selectedFiles.map(file => updatePaymentsFileStatus(file.id)))
        }
    }

    return { downloadPaymentsFiles }
}
