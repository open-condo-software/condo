/**
* Client side permission functions (similar to accessors) which will be used to avoid illegal user interactions
* */
import get from 'lodash/get'
import { Organization, OrganizationEmployee, User } from '../../schema'

//TODO(Dimitreee): use from scheema.d.ts when OrganizationToUserLink will be included
interface OrganizationToUserLink {
    id: string
    organization: Pick<Organization, 'id' | 'name' | 'description'>
    user: Pick<User, 'id'>
    role: string
}

export const canManageEmployee = (organizationLink?: OrganizationToUserLink, employee?: OrganizationEmployee): boolean => {
    if (!organizationLink || !employee) {
        return false
    }

    const isOrganizationEqual = get(organizationLink, ['organization', 'id']) === get(employee, ['organization', 'id'])

    if (isOrganizationEqual) {
        return get(organizationLink, ['role', 'canManageEmployees'])
    }

    return false
}

export const canReinviteEmployee = (organizationLink?: OrganizationToUserLink, employee?: OrganizationEmployee): boolean => {
    const isEmployeeManageable = canManageEmployee(organizationLink, employee)

    if (isEmployeeManageable) {
        return !employee.isAccepted
    }

    return false
}
