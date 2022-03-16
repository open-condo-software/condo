/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const TICKET_CREATE_URL = '/ticket/create'
const TICKET_VIEW_URL = '/ticket'

class TicketCreate {
/*
    Elements:
        organization-select-item
        property-address-search-input-item
        property-address-search-option
        unit-name-input-item
        unit-name-input-option
        ticket-description-input
        ticket-place-select-item
        ticket-category-select-item
        ticket-problem-select-item
        ticket-classifier-option
        ticket-submit-btn
*/

    visit () {
        cy.visit(TICKET_CREATE_URL)
        return this
    }

    clickAndInputAddress (address) {
        cy.get('[data-cy=property-address-search-input-item] input', {
            timeout: 5000,
        }).should('be.visible')
        cy.wait('@getAllProperties')

        cy.get('[data-cy=property-address-search-input-item] input')
            .click({ force: true })
            .focus()
            .type(address.slice(0, 5))
        return this
    }

    chooseAddressForTicket () {
        cy.get('[data-cy=property-address-search-option]')
            .click()
        return this
    }

    clickAndInputUnitName (unitName) {
        cy.get('[data-cy=unit-name-input-item] .ant-select-selection-search')
            .click({ force: true })
            .type(unitName)
        return this
    }

    chooseUnitName () {
        cy.get('[data-cy=unit-name-input-option]')
            .first()
            .click()
        return this
    }

    clickAndInputDescription (description) {
        cy.get('[data-cy=ticket-description-input]')
            .click()
            .type(description)
        return this
    }

    selectProblemWithCategoryClassifier () {
        cy.get('[data-cy=ticket-place-select-item] .ant-select-selection-search')
            .click()

        cy.get('[data-cy=ticket-classifier-option]')
            .first()
            .click()
        cy.wait('@getAllDivisions')
        cy.get('[data-cy=ticket-place-select-item] .ant-select-selection-search').should('not.have.class', '.ant-select-open')

        cy.get('[data-cy=ticket-category-select-item] .ant-select-selection-search')
            .click()
            .type('{downArrow}')
        cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) [data-cy=ticket-classifier-option]')
            .first()
            .click()
        return this
    }

    clickOnSubmitButton () {
        cy.get('[data-cy=ticket-submit-btn]')
            .click()

        cy.location('pathname').should('not.eq', TICKET_CREATE_URL)
        cy.location('pathname').should('contain', TICKET_VIEW_URL)
        return this
    }
}

class TicketView {
/*
    Elements:
        ticket-filter-isWarranty
        ticket-filter-isPaid
        ticket-filter-isEmergency
        tickets-table
        ticket-filters-button
        filters-button-submit
        filters-button-reset
*/
    visit () {
        cy.visit(TICKET_VIEW_URL)
        cy.wait('@getAllTickets')
        return this
    }

    clickIsWarrantyCheckbox () {
        cy.get('[data-cy=ticket-filter-isWarranty]').click()
        cy.location('search').should('contain', 'isWarranty')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 1)

        cy.get('[data-cy=ticket-filter-isWarranty]').click()
        cy.location('search').should('not.contain', 'isWarranty')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 3)

        return this
    }

    clickIsPaidCheckbox () {
        cy.get('[data-cy=ticket-filter-isPaid]').click()
        cy.location('search').should('contain', 'isPaid')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 1)

        cy.get('[data-cy=ticket-filter-isPaid]').click()
        cy.location('search').should('not.contain', 'isPaid')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 3)

        return this
    }

    clickIsEmergencyCheckbox () {
        cy.get('[data-cy=ticket-filter-isEmergency]').click()
        cy.location('search').should('contain', 'isEmergency')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 1)

        cy.get('[data-cy=ticket-filter-isEmergency]').click()
        cy.location('search').should('not.contain', 'isEmergency')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 3)

        return this
    }

    clickOnGlobalFiltersButton () {
        cy.get('[data-cy=ticket-filters-button]').click()
        cy.wait('@getAllTicketFilterTemplates')

        return this
    }

    typeAddressSearchInput (propertyAddress) {
        cy.get('input#property')
            .click()
            .type(propertyAddress.slice(0, 5))
            .type('{downArrow}')
            .type('{enter}')

        cy.get('[data-cy=filters-button-submit]').click()

        cy.wait('@getAllTickets')
        cy.location('search').should('contain', 'property')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 3)

        cy.get('[data-cy=filters-button-reset]').click()
        cy.wait('@getAllTickets')
        cy.location('search').should('not.contain', 'property')
        cy.location('search').should('be.empty')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 3)

        return this
    }
}

class TicketEdit {
/*
    Elements:
        tickets-table
        ticket-status-select
        ticket-status-select-option
        ticket-update-link
        ticket-deadline-item
        ticket-assignee-item
        ticket-apply-changes-button
 */
    visit () {
        cy.visit(TICKET_VIEW_URL)
        cy.wait('@getAllTicketClassifierRules')

        cy.get('[data-cy=tickets-table] tbody tr').first().trigger('click')
        cy.location('pathname').should('not.eq', TICKET_VIEW_URL)

        return this
    }

    changeTicketStatus () {
        cy.wait('@getAllTicketComments')
        cy.wait('@getAllTickets')
        cy.wait('@getAllTicketClassifierRules')
        cy.wait('@getAllTicketFiles')
        cy.wait('@getAllTicketStatuses')

        cy.get('[data-cy=ticket-status-select]')
            .click()
        cy.wait('@getAllTicketClassifierRules')
        cy.get('[data-cy=ticket-status-select-option]', {
            timeout: 5000,
        }).first().click()

        return this
    }

    clickUpdateTicketLink () {
        cy.get('[data-cy=ticket-update-link]').click()
        cy.location('pathname').should('contain', '/update')

        return this
    }

    clickProblemClassifier () {
        cy.get('[data-cy=ticket-place-select-item] .ant-select-selection-search')
            .click()

        cy.get('[data-cy=ticket-classifier-option]')
            .first()
            .click()
        cy.wait('@getAllDivisions')
        cy.get('[data-cy=ticket-place-select-item] .ant-select-selection-search').should('not.have.class', '.ant-select-open')

        cy.get('[data-cy=ticket-category-select-item] .ant-select-selection-search')
            .click()
            .type('{downArrow}')
        cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) [data-cy=ticket-classifier-option]')
            .first()
            .click()
        return this
    }

    clickTicketDeadline () {
        cy.get('[data-cy=ticket-deadline-item]').click()
        cy.get('.ant-picker-today-btn').click()

        return this
    }

    clickAssigneeInput () {
        cy.get('[data-cy=ticket-assignee-item] input')
            .click()
            .type('{downArrow}')
            .type('{enter}')

        return this
    }

    clickApplyChanges () {
        cy.get('[data-cy=ticket-apply-changes-button]').click()
        cy.location('pathname').should('not.contain', '/update')

        return this
    }
}

export {
    TicketCreate,
    TicketView,
    TicketEdit,
}
