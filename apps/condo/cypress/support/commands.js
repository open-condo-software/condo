/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

Cypress.Commands.add('waitForCaptcha', function () {
    cy.get('iframe').first()
})

