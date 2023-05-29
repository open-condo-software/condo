import React from 'react'

import { CreateNewsForm } from './CreateNewsForm'
import { UpdateNewsForm } from './UpdateNewsForm'

interface INewsFormProps {
    id?: string
}

export const NewsForm: React.FC<INewsFormProps> = ({ id }) => {
    return ( id ? <UpdateNewsForm id={id} /> : <CreateNewsForm /> )
}