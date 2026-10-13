describe('CP-INV-001 - Crear producto con datos válidos', () => {
  const id = Date.now()
  const producto = {
    nombre: `Arroz 500 g ${id}`,
    codigo: `ARR-${id}`,
    categoria: 'Granos',
    precio: '3500',
    stock: '20',
    stockMinimo: '5'
  }
  const imagen = {
    contents: Cypress.Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    ),
    fileName: 'arroz.png',
    mimeType: 'image/png'
  }

  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.loginAdmin()
  })

  it('guarda el producto y aparece en el inventario', () => {
    cy.visit('http://localhost:5173/inventario')
    cy.contains('button', 'Agregar producto').click()

    cy.contains('label', /^Nombre$/).find('input').type(producto.nombre)
    cy.contains('label', /^Código$/).find('input').clear().type(producto.codigo)
    cy.get('input[list="lista-categorias"]').type(producto.categoria)
    cy.get('input[type="file"]').selectFile(imagen, { force: true })
    cy.contains('label', /^Precio$/).find('input').type(producto.precio)
    cy.contains('label', /^Stock$/).find('input').type(producto.stock)
    cy.contains('label', 'Stock mínimo').find('input').type(producto.stockMinimo)

    cy.contains('button', 'Guardar producto').scrollIntoView().click()

    cy.contains(producto.nombre).should('be.visible')
  })
})