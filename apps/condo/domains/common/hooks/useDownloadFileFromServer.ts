import { useCallback } from 'react'
import { notification } from 'antd'

import { useIntl } from '@open-condo/next/intl'


type FileType = {
    url: string
    name: string
}
type DownloadFileType = (file: FileType) => Promise<void>
type UseDownloadFileFromServerType = () => { downloadFile: DownloadFileType }

const ERROR_DOWNLOAD_FILE = 'Failed to download file'
const DIRECT_DOWNLOAD_FILE_TYPES_REGEX = /.*\.(svg|html|htm|xml|txt)$/i

export const useDownloadFileFromServer: UseDownloadFileFromServerType = () => {
    const intl = useIntl()
    const DownloadFileErrorMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketFileList.downloadFileError' })
    const handleDownloadFile = useCallback(async (file: FileType) => {
        /*
        * NOTE
        * Problem:
        *   In the case of a redirect according to the scheme: A --request--> B --redirect--> C,
        *   it is impossible to read the response of the request.
        *
        * Solution:
        *   When adding the "shallow-redirect" header,
        *   the redirect link to the file comes in json format and a second request is made to get the file.
        *   Thus, the scheme now looks like this: A --request(1)--> B + A --request(2)--> C
        * */
        const redirectResponse = await fetch(file.url, {
            credentials: 'include',
            headers: {
                'shallow-redirect': 'true',
            },
        })
        if (!redirectResponse.ok) throw new Error(ERROR_DOWNLOAD_FILE)
        const json = await redirectResponse.json()
        const redirectUrl = json.redirectUrl
        const fileResponse = await fetch(redirectUrl)
        if (!fileResponse.ok) throw new Error(ERROR_DOWNLOAD_FILE)

        const blob = await fileResponse.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = file.name
        a.click()
    }, [])

    const downloadFile: DownloadFileType = useCallback(async (file: FileType) => {
        if (DIRECT_DOWNLOAD_FILE_TYPES_REGEX.test(file.name)) {
            try {
                await handleDownloadFile(file)
            } catch (e) {
                notification.error({ message: DownloadFileErrorMessage })
            }
        } else {
            window.open(file.url, '_blank')
        }
    }, [DownloadFileErrorMessage, handleDownloadFile])

    return { downloadFile }
}
