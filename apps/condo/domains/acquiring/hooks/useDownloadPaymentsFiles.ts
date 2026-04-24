import { useApolloClient } from '@apollo/client'
import {
    useGetPaymentsFilesLazyQuery,
    useUpdatePaymentsFileMutation,
} from '@app/condo/gql'
import { PaymentsFileStatusType } from '@app/condo/schema'
import JSZip from 'jszip'
import { useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'

import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'


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
            await Promise.all(selectedFiles.map(async (file) => {
                const response = await fetch(file?.file?.publicUrl)
                if (!response?.ok) {
                    console.error('Could not download file, file id: ', file?.id)
                }

                const blob = await response.blob()
                zip.file(file.file.originalFilename, blob)

                await updatePaymentsFileStatus(file.id)
            }))

            let zipUrl = null
            try {
                const zipBlob = await zip.generateAsync({ type: 'blob' })
                zipUrl = URL.createObjectURL(zipBlob)
                if (zipUrl) {
                    await downloadFile({ url: zipUrl, name: 'payments_files.zip' })
                } else {
                    console.error('Error creating object URL for zip file')
                }
            } catch (error) {
                console.error('Error generating or downloading zip file:', error)
            } finally {
                if (zipUrl) {
                    URL.revokeObjectURL(zipUrl)
                }
            }
        }
    }

    return { downloadPaymentsFiles }
}