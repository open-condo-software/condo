import { useReducer } from 'react'


type FilePayload = {
    id?: string
    response?: {
        id?: string
    }
}

type State = {
    added: Array<FilePayload>
    deleted: Array<FilePayload>
}

export type Action =
    | { type: 'delete', payload: FilePayload }
    | { type: 'add', payload: FilePayload }
    | { type: 'reset', payload?: undefined }

const reducer = (state: State, action: Action): State => {
    const { type, payload: file } = action
    switch (type) {
        case 'delete': {
            const fileToDeleteId = file?.id || (file as any)?.response?.id
            if (!fileToDeleteId) return state

            return {
                ...state,
                added: state.added.filter(addFile => addFile.id !== fileToDeleteId),
                deleted: [...state.deleted, file],
            }
        }
        case 'add':
            return {
                ...state,
                added: [...state.added, file],
            }
        case 'reset':
            return {
                added: [],
                deleted: [],
            }
        default:
            throw new Error(`unknown action ${type}`)
    }
}

const initialState: State = { added: [], deleted: [] }

export const useModifiedFiles = () => {
    const [modifiedFiles, dispatch] = useReducer(reducer, initialState)

    return {
        modifyFiles: dispatch,
        modifiedFiles,
    }
}
