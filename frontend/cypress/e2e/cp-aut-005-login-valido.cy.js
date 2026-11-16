describe('CP-AUT-005 - Iniciar sesión con credenciales válidas', () => {
  it('el administrador inicia sesión y ve el Inicio', () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type(Cypress.env('adminCorreo'))
    cy.get('input[type="password"]').type(Cypress.env('adminContrasena'), { log: false })

    cy.contains('button', 'Entrar al sistema').click()

    cy.url().should('include', '/dashboard')
  })
})