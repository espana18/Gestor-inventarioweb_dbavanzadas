describe('CP-AUT-006 - Iniciar sesión con contraseña incorrecta', () => {
  it('no inicia sesión y muestra el mensaje de error', () => {
    cy.visit('http://localhost:5173/login')
    cy.get('input[type="email"]').type('admin@tiendaprueba.com')
    cy.get('input[type="password"]').type('Incorrecta1*')

    cy.contains('button', 'Entrar al sistema').click()

    cy.contains('Correo o contraseña incorrectos').should('be.visible')
    cy.url().should('include', '/login')
  })
})