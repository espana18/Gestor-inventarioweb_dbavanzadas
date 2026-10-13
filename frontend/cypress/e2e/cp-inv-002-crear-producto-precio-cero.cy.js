describe('CP-INV-002 - Crear producto con precio 0', () => {
  const imagen = {
    contents: Cypress.Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    ),
    fileName: 'limite.png',
    mimeType: 'image/png'
  }

  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.loginAdmin()
  })

  it('no guarda el producto y muestra el mensaje de precio', () => {
    cy.visit('http://localhost:5173/inventario')
    cy.contains('button', 'Agregar producto').click()

    cy.contains('label', /^Nombre$/).find('input').type('Producto límite')
    cy.get('input[list="lista-categorias"]').type('Granos')
    cy.get('input[type="file"]').selectFile(imagen, { force: true })
    cy.contains('label', /^Precio$/).find('input').type('0')
    cy.contains('label', /^Stock$/).find('input').type('10')
    cy.contains('label', 'Stock mínimo').find('input').type('5')

    cy.contains('button', 'Guardar producto').scrollIntoView().click()

    // Resultado esperado del caso (texto exacto, sin modificar)
    cy.contains('El precio del producto debe ser mayor que cero').should('be.visible')
    // Y el producto no se guardó: el formulario sigue abierto
    cy.contains('button', 'Guardar producto').should('be.visible')
  })
})