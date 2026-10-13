describe('CP-AUT-005 - Iniciar sesión con credenciales válidas', () => {
  it('el administrador inicia sesión y ve el Inicio', () => {
    cy.visit('http://localhost:5173/login')
    cy.get('input[type="email"]').type('admin@tiendaprueba.com')
    cy.get('input[type="password"]').type('Clave1234*')

    cy.contains('button', 'Entrar al sistema').click()

    cy.url().should('include', '/dashboard')
  })
})