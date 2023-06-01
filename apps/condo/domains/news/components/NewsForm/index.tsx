import Error from 'next/error'
import React from 'react'

import { CreateNewsForm } from './CreateNewsForm'
import { ResendNewsForm } from './ResendNewsForm'
import { UpdateNewsForm } from './UpdateNewsForm'

interface INewsFormProps {
    id?: string
    actionName: 'create' | 'update';
}

export const NewsForm: React.FC<INewsFormProps> = ({ id, actionName }) => {
    if (actionName === 'create') {
        if (id) {
            return <ResendNewsForm id={id}/>
        } else {
            return <CreateNewsForm/>
        }
    } else if (actionName === 'update') {
        return <UpdateNewsForm id={id} />
    } else {
        return <Error statusCode={404}/>
    }
}