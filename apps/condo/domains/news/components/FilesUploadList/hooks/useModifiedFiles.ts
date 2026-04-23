import { useReducer } from 'react'


type State = {
    added: Array<{ id: string }>
    deleted: Array<{ id: string }>
}

export type Action =
    | { type: 'delete', payload: { id: string } }
    | { type: 'add', payload: { id: string } }
    | { type: 'reset', payload?: undefined }

const reducer = (state: State, action: Action): State => {
    const { type, payload: file } = action
    switch (type) {
        case 'delete': {
            if (file.id) {
                return {
                    ...state,
                    added: state.added.filter(addFile => addFile.id !== file.id),
                    deleted: [...state.deleted, file],
                }
            }

            const fileToDeleteId = (file as any)?.response?.id

            if (!fileToDeleteId) return state

            const fileToDelete = state.added.find(addedFile => addedFile.id === fileToDeleteId)
            return {
                ...state,
                added: state.added.filter(addFile => addFile.id !== fileToDeleteId),
                deleted: [...state.deleted, fileToDelete],
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
