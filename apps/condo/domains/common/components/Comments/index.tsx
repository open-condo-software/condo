import { CommentsList } from './CommentsList'

export type Comment = {
    id: string,
    content: string,
    user: {
        id: string,
        name: string,
    },
    createdAt: string,
    updatedAt: string,
}

export {
    CommentsList,
}