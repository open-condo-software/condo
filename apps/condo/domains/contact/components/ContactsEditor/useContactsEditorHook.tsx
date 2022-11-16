import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ContactsEditor, IContactEditorProps } from './index'
import { OrganizationEmployeeRole } from '@app/condo/schema'

interface IContactsEditorHookArgs {
    role?: OrganizationEmployeeRole,
    allowLandLine?: boolean,
    initialQuery?: unknown
}

interface IContactsEditorHookResult {
    ContactsEditorComponent: React.FC<IContactEditorProps>
}

export const useContactsEditorHook = ({ initialQuery, organization, role, allowLandLine }: IContactsEditorHookArgs): IContactsEditorHookResult => {
    const [shouldCreateContact, setShouldCreateContact] = useState(false)

    const shouldCreateContactRef = useRef(shouldCreateContact)
    useEffect(() => {
        shouldCreateContactRef.current = shouldCreateContact
    }, [shouldCreateContact])

    const handleChangeContact = (values, isNew) => {
        setShouldCreateContact(isNew)
    }

    const roleRef = useRef(role)
    useEffect(() => {
        roleRef.current = role
    }, [role])

    const ContactsEditorComponent: React.FC<IContactEditorProps> = useMemo(() => {
        const ContactsEditorWrapper = (props) => (
            <ContactsEditor
                {...props}
                role={roleRef.current}
                onChange={handleChangeContact}
                allowLandLine={allowLandLine}
                initialQuery={initialQuery}
            />
        )
        return ContactsEditorWrapper
    }, [])

    return {
        ContactsEditorComponent,
    }
}
