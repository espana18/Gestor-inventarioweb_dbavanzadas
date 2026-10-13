describe('CP-AUT-002 - Registrar tienda con contraseñas que no coinciden', () => {
  it('no registra la tienda y muestra el mensaje de error', () => {
    cy.viewport(1280, 900)
    cy.visit('http://localhost:5173/registro')

    // Paso 1 de 2: datos de la tienda
    cy.get('input[placeholder="Mi tienda"]').type('Tienda Contraseñas')
    cy.get('input[placeholder="Nombre del propietario"]').type('Prueba Registro')
    cy.contains('button', 'Continuar').click()

    // Paso 2 de 2: contraseñas distintas
    cy.get('input[placeholder="correo@tutienda.com"]').type('registro@tiendaprueba.com')
    cy.get('input[placeholder="Mínimo 8 caracteres"]').type('Clave1234*')
    cy.get('input[placeholder="Repite la contraseña"]').type('Clave9999*')
    cy.contains('button', 'Crear mi tienda').click()

    // Resultado esperado del caso (texto exacto, sin modificar)
    cy.contains('Las contraseñas no coinciden').should('be.visible')
    // No se registró: seguimos en la página de registro
    cy.url().should('include', '/registro')
  })
})