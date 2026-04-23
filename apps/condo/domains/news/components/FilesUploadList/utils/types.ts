import { GetNewsItemFilesQuery } from '@app/condo/gql'

import { UploadFileType } from '../FilesUploadList'


export const convertFilesToUploadType: (files: GetNewsItemFilesQuery['newsItemFiles']) => UploadFileType[] = (files) => {
    if (!Array.isArray(files)) {
        return []
    }

    return files.map(fileObj => {
        return {
            uid: fileObj?.id,
            id: fileObj?.id,
            name: fileObj?.file?.originalFilename,
            status: 'done',
            url: fileObj?.file?.publicUrl,
            response: { id: fileObj?.id, url: fileObj?.file?.publicUrl, originalName: fileObj?.file?.originalFilename, mimetype: fileObj?.file?.mimetype },
        }
    })
}
