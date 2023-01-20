import { notification } from 'antd'
import { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'


type FileType = {
    url: string
    name: string
}
type DownloadFileType = (file: FileType) => Promise<void>
type UseDownloadFileFromServerType = () => { downloadFile: DownloadFileType }
type GetRedirectUrlType = (response: Response) => Promise<string | null>

const ERROR_DOWNLOAD_FILE = 'Failed to download file'
const DIRECT_DOWNLOAD_FILE_TYPES_REGEX = /.*\.(svg|html|htm|xml|txt)$/i

const downloadFile = async (response: Response, file: FileType) => {
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = file.name
    a.click()
}

const getRedirectUrl: GetRedirectUrlType = async (response) => {
    try {
        const json = await response.clone().json()
        return json.redirectUrl
    } catch (err) {
        return null
    }
}

const tryDownloadFile = async (file: FileType) => {
    /*
    * NOTE:
    * Problem:
    *   In the case of a redirect according to the scheme: A --request--> B --redirect--> C,
    *   it is impossible to read the response of the request.
    *
    * Solution:
    *   When adding the "shallow-redirect" header,
    *   the redirect link to the file comes in json format and a second request is made to get the file.
    *   Thus, the scheme now looks like this: A --request(1)--> B + A --request(2)--> C
    * */
    const firstResponse = await fetch(file.url, {
        credentials: 'include',
        headers: {
            'shallow-redirect': 'true',
        },
    })
    if (!firstResponse.ok) throw new Error(ERROR_DOWNLOAD_FILE)
    const redirectUrl = await getRedirectUrl(firstResponse)

    if (redirectUrl) {
        const secondResponse = await fetch(redirectUrl)
        if (!secondResponse.ok) throw new Error(ERROR_DOWNLOAD_FILE)
        await downloadFile(secondResponse, file)
    } else {
        // NOTE:
        // If there is no redirect url (for example, with a local file adapter),
        // then we try to download the file
        await downloadFile(firstResponse, file)
    }
}

export const useDownloadFileFromServer: UseDownloadFileFromServerType = () => {
    const intl = useIntl()
    const DownloadFileErrorMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketFileList.downloadFileError' })

    const downloadFile: DownloadFileType = useCallback(async (file: FileType) => {
        if (DIRECT_DOWNLOAD_FILE_TYPES_REGEX.test(file.name)) {
            try {
                await tryDownloadFile(file)
            } catch (error) {
                console.error('Failed to download file', error)
                notification.error({ message: DownloadFileErrorMessage })
            }
        } else {
            window.open(file.url, '_blank')
        }
    }, [DownloadFileErrorMessage])

    return { downloadFile }
}
