import {
    ContactWhereInput,
} from '@app/condo/schema'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { ContactsEditor, IContactEditorProps } from './index'

interface IContactsEditorHookArgs {
    initialQuery?: Pick<ContactWhereInput, 'organization'>
    loading?: boolean
}

interface IContactsEditorHookResult {
    ContactsEditorComponent: React.FC<IContactEditorProps>
}

// TODO(INFRA-584): this hook should be refactored
export const useContactsEditorHook = ({ initialQuery, loading }: IContactsEditorHookArgs): IContactsEditorHookResult => {
    const [shouldCreateContact, setShouldCreateContact] = useState(false)

    const shouldCreateContactRef = useRef(shouldCreateContact)
    useEffect(() => {
        shouldCreateContactRef.current = shouldCreateContact
    }, [shouldCreateContact])

    const handleChangeContact = (values, isNew) => {
        setShouldCreateContact(isNew)
    }

    const ContactsEditorComponent: React.FC<IContactEditorProps> = useMemo(() => {
        const ContactsEditorWrapper = (props) => (
            <ContactsEditor
                {...props}
                onChange={handleChangeContact}
                initialQuery={initialQuery}
            />
        )
        return ContactsEditorWrapper
    }, [loading])

    return {
        ContactsEditorComponent,
    }
}
