/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

const TICKET_CREATE_URL = '/ticket/create/'

class TicketCreate {
/*
    Elements:
        organization-select-item
        property-address-search-input-item
        property-address-search-option
        unit-name-input-item
        unit-name-input-option
        ticket-description-input
*/

    visit () {
        cy.visit(TICKET_CREATE_URL)
        return this
    }

    chooseOrganization () {
        const field = cy.get('[data-cy=organization-select-item]')
        field.click()
        return this
    }

    clickAndInputAddress (address) {
        const field = cy.get('[data-cy=property-address-search-input-item] input')
        field.click({ force: true })
        field.focus()
        field.type(address)
        return this
    }

    chooseAddressForTicket () {
        const field = cy.get('[data-cy=property-address-search-option]')
        field.click()
        return this
    }

    clickAndInputUnitName (unitName) {
        const field = cy.get('[data-cy=unit-name-input-item] .ant-select-selection-search')
        field.click({ force: true })
        field.type(unitName)
        return this
    }

    chooseUnitName () {
        const field = cy.get('[data-cy=unit-name-input-option]')
        field.first().click()
        return this
    }

    clickAndInputDescription (description) {
        const field = cy.get('[data-cy=ticket-description-input]')
        field.click()
        field.type(description)
        return this
    }
}

export {
    TicketCreate,
}
