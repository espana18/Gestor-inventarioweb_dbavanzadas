/// <reference types="cypress" />

// Las credenciales se leen de cypress.env.json (excluido de Git) o de
// variables de entorno CYPRESS_*. Ver cypress.env.example.json.

Cypress.Commands.add('loginAdmin', () => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(Cypress.env('adminCorreo'))
  cy.get('input[type="password"]').type(Cypress.env('adminContrasena'), { log: false })
  cy.contains('button', 'Entrar al sistema').click()
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('loginCajero', () => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(Cypress.env('cajeroCorreo'))
  cy.get('input[type="password"]').type(Cypress.env('cajeroContrasena'), { log: false })
  cy.contains('button', 'Entrar al sistema').click()
  cy.url().should('include', '/caja')
})

// Inicia sesión por API y devuelve el token JWT. rol: 'admin' | 'cajero'
Cypress.Commands.add('apiLogin', (rol: 'admin' | 'cajero') => {
  return cy
    .request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
      correo: Cypress.env(`${rol}Correo`),
      contrasena: Cypress.env(`${rol}Contrasena`)
    })
    .then((resp) => resp.body.datos.token as string)
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginAdmin(): Chainable<void>
      loginCajero(): Chainable<void>
      apiLogin(rol: 'admin' | 'cajero'): Chainable<string>
    }
  }
}

export {}
