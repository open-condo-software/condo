/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */
import { HOME_PAGE_URL } from './Home'

const FORGOT_PASSWORD_URL = `${HOME_PAGE_URL}/auth/forgot`

/*
forgot-email-item
forgot-button
forgot-success-message
*/

class ForgotPassword {

    visit () {
        cy.visit(FORGOT_PASSWORD_URL)
        return this
    }

    fillEmail (value) {
        const field = cy.get('[data-ci=forgot-email-item] input')
        field.clear()
        field.type(value)
        return this
    }

    startPasswordRecovery () {
        const button = cy.get('[data-ci=forgot-button]')
        button.click()
        return this
    }

    checkSuccess () {
        cy.get('[data-ci=forgot-success-message]')
        return this
    }

}

export {
    ForgotPassword,
    FORGOT_PASSWORD_URL,
}
