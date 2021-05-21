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
    console.log('keystoneFileList', keystoneFileList)
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
    const deleteAction = Model.useUpdate({ id: '4daeeebc-9df8-4f67-a674-f3f90208fb50' }, () => Promise.resolve())

    const options = {
        onChange ({ file, fileList }) {
            if (file.status !== 'uploading') {
                console.log(file, fileList)
            }
        },
        showUploadList: {
            showRemoveIcon: true,
            removeIcon: (file) => {
                return (
                    <DeleteOutlined onClick={() => {
                        console.log('file is file', file)
                        const { id } = file
                        console.log(deleteAction)
                        return deleteAction({ }, { id, deletedAt: 'true' })
                    }} />
                )
            },
        },
        action: ({ onSuccess, onError, file }) => {
            return createAction({ ...initialCreateValues, file }).catch(err => {
                onError(err)
            }).then( () => {
                onSuccess('Ok')
            })
        },
        beforeUpload (file) {
            if (file.size > MAX_FILE_SIZE) {
                console.log(`${file.name} is too big `)
                return false
            }
        },
    }
    return (
        <Form.Item
            label={UploadedFilesLabel}
        >
            <Upload
                defaultFileList={fileList}
                onChange={options.onChange}
                beforeUpload={options.beforeUpload}
                customRequest={options.action}
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
