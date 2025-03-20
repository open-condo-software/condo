import JSZip from 'jszip'

import { PAYMENTS_FILE_DOWNLOADED_STATUS } from '@condo/domains/acquiring/constants/constants'
import { PaymentsFile } from '@condo/domains/acquiring/utils/clientSchema'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'


export default function useDownloadRegistryFiles (refetch) {
    const { downloadFile } = useDownloadFileFromServer()
    const updateRegistryStatus = PaymentsFile.useUpdate({
        status: PAYMENTS_FILE_DOWNLOADED_STATUS,
    }, () => refetch())

    const downloadRegistryFiles = async (selectedRegistryIds, paymentsFiles) => {
        const selectedFiles = paymentsFiles.filter(file => selectedRegistryIds.includes(file.id))

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
                await updateRegistryStatus({}, { id: file.id })
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

                await updateRegistryStatus({}, { id: file.id })
            }))

            const zipBlob = await zip.generateAsync({ type: 'blob' })
            const zipUrl = URL.createObjectURL(zipBlob)

            if (zipUrl) {
                await downloadFile({ url: zipUrl, name: 'payments_files.zip' })
            } else {
                console.error('Error downloading zip payments file')
            }

            URL.revokeObjectURL(zipUrl)
        }
    }

    return { downloadRegistryFiles }
}