import React, { useEffect, useState, useRef } from 'react'
import { Upload, Button, Form } from 'antd'
import { useIntl } from '@core/next/intl'
import { UploadOutlined } from '@ant-design/icons'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'

interface IMultipleFileUploadProps {
    fileList: unknown
    updateValue: (files: unknown) => void
    saveMutation: string
    action: unknown
}


const MultipleFileUpload: React.FC<IMultipleFileUploadProps> = ({ fileList, updateValue, saveMutation, action }) => {
    const intl = useIntl()
    const UploadedFilesLabel = 'Прикреплённые файлы'
    const AddFileLabel = 'Добавить файл'
    const [uploadMutation] = useMutation(saveMutation)
    console.log(fileList)
    const options = {
        beforeUpload (file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                console.log('file is file', file)
                reader.readAsDataURL(file)
                reader.onload = () => {
                    console.log('reader is reader', reader)
                    runMutation({
                        mutation: uploadMutation,
                        intl,
                        variables: {
                            file,
                        },
                    }).catch(error => {
                        console.log('AAAA', error)
                    }).then((result) => {
                        console.log('result', result)
                        return reject()
                    })
                }
            })
        },
    }
    return (
        <Form.Item
            name={'files'}
            label={UploadedFilesLabel}
        >
            <Upload 
                { ...options}
                
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
