import React from 'react'
import { Upload, Button, Form } from 'antd'
import { useIntl } from '@core/next/intl'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import { UploadFileStatus } from 'antd/lib/upload/interface'


const MAX_FILE_SIZE = 20 * 1024 * 1024

interface IMultipleFileUploadProps {
    fileList: unknown
    updateValue: (files: unknown) => void
    saveMutation: string
    initialCreateValues: Record<string, unknown>,
    ticket: Record<string, unknown>,
    Model: unknown
}


const MultipleFileUpload: React.FC<IMultipleFileUploadProps> = ({ fileList: keystoneFileList, updateValue, initialCreateValues, Model }) => {
    const intl = useIntl()
    const UploadedFilesLabel = 'Прикреплённые файлы'
    const AddFileLabel = 'Добавить файл'
    const FileTooBigErrorMessage = 'Файл слишком большой'

    const fileList = keystoneFileList.map(({ id, file }) => {
        return {
            uid: file.id,
            id,
            name: file.originalFilename,
            status: 'done' as UploadFileStatus,
            url: file.publicUrl,
        }
    })

    const createAction = Model.useCreate(initialCreateValues, () => Promise.resolve())
    const deleteAction = Model.useSoftDelete({}, () => Promise.resolve())

    const options = {
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
        customRequest: ({ onSuccess, onError, file }) => {
            console.log('onSuccess, onError, file', onSuccess, onError, file, MAX_FILE_SIZE)
            if (file.size < MAX_FILE_SIZE) {
                onError(new Error(FileTooBigErrorMessage))
                return 
            }
            return createAction({ ...initialCreateValues, file }).catch(err => {
                onError(err)
            }).then( () => {
                onSuccess('Ok')
            })
        },
    }
    return (
        <Form.Item
            label={UploadedFilesLabel}
        >
            <Upload
                defaultFileList={fileList}
                customRequest={options.customRequest}
                showUploadList={options.showUploadList}
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
