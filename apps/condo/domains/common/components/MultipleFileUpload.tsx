import React from 'react'
import { Upload, Button, Form } from 'antd'
import { useIntl } from '@core/next/intl'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'

type DBFile = {
    id: string
    file: {
        id: string
        originalFilename: string
        publicUrl: string
    }
}
interface IMultipleFileUploadProps {
    fileList: DBFile[]
    initialCreateValues: Record<string, unknown>,
    Model: {
        useCreate: (attrs, onComplete) => (attrs) => Promise<unknown>
        useSoftDelete: (attrs, onComplete) => (context, attrs) => Promise<unknown>
    }
}

const MultipleFileUpload: React.FC<IMultipleFileUploadProps> = ({ fileList: keystoneFileList, initialCreateValues, Model }) => {
    const intl = useIntl()
    const UploadedFilesLabel = intl.formatMessage({ id: 'component.uploadlist.AttachedFilesLabel' })
    const AddFileLabel = intl.formatMessage({ id: 'component.uploadlist.AddFileLabel' })
    const FileTooBigErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.FileTooBig' })
    
    const createAction = Model.useCreate(initialCreateValues, () => Promise.resolve())
    const deleteAction = Model.useSoftDelete({}, () => Promise.resolve())

    const options = {
        defaultFileList: keystoneFileList.map(({ id, file }) => {
            const fileInList = {
                uid: file.id,
                id,
                name: file.originalFilename,
                status: null,
                url: file.publicUrl,
            }
            fileInList.status = 'done'
            return fileInList        
        }),
        showUploadList: {
            showRemoveIcon: true,
            removeIcon: (file) => {
                const removeIcon = (
                    <DeleteOutlined onClick={() => {
                        const { id } = file
                        if (!id) {
                            return 
                        }
                        return deleteAction({}, { id })
                    }} />
                )
                return removeIcon
            },
        }, 
        customRequest: (options: UploadRequestOption) => {
            const { onSuccess, onError, file } = options
            // Todo(zuch): typescript error  Rcfile extends File extends Blob - but size attribute is not visible for ts
            if ((file as Blob).size > MAX_UPLOAD_FILE_SIZE) {
                onError(new Error(FileTooBigErrorMessage))
                return 
            }
            return createAction({ ...initialCreateValues, file }).catch(err => {
                onError(err)
            }).then( () => {
                onSuccess('Ok', null)
            })
        },
    }
    return (
        <Form.Item
            label={UploadedFilesLabel}
        >
            <Upload
                { ...options }
            >
                <Button
                    icon={<UploadOutlined />}
                    size={'middle'}
                >{AddFileLabel}</Button>
            </Upload>
        </Form.Item>
    )
}

export default MultipleFileUpload
