const API = 'http://localhost:3001/api'

describe('CP-SEG-002 - Cajero intenta crear o eliminar productos', () => {
  const id = Date.now()
  const nuevoProducto = (sufijo) => ({
    nombre: `Producto SEG-002 ${id}${sufijo}`,
    codigoProducto: `SEG-${id}${sufijo}`,
    categoria: 'Granos',
    precio: 1000,
    stock: 5,
    stockMinimo: 1,
    imagenUrl: 'https://ejemplo.com/prueba.jpg'
  })

  let tokenAdmin
  let tokenCajero
  let idProductoPrueba
  const idsParaLimpiar = []

  before(() => {
    // Token del administrador y del cajero
    cy.request('POST', `${API}/auth/login`, {
      correo: 'admin@tiendaprueba.com',
      contrasena: 'Clave1234*'
    }).then((resp) => {
      tokenAdmin = resp.body.datos.token
    })
    cy.request('POST', `${API}/auth/login`, {
      correo: 'martha@tiendaprueba.com',
      contrasena: 'Cajero123*'
    }).then((resp) => {
      tokenCajero = resp.body.datos.token
    })
    // El administrador crea un producto para que el cajero intente eliminarlo
    cy.then(() =>
      cy.request({
        method: 'POST',
        url: `${API}/productos`,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        body: nuevoProducto('-A')
      })
    ).then((resp) => {
      idProductoPrueba = resp.body.datos.id
    })
  })

  it('el cajero no puede crear productos (esperado 403)', () => {
    cy.request({
      method: 'POST',
      url: `${API}/productos`,
      headers: { Authorization: `Bearer ${tokenCajero}` },
      body: nuevoProducto('-B'),
      failOnStatusCode: false
    }).then((resp) => {
      if (resp.status === 201) idsParaLimpiar.push(resp.body.datos.id)
      expect(resp.status, 'código HTTP del POST hecho por el cajero').to.eq(403)
    })
  })

  it('el cajero no puede eliminar productos (esperado 403)', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/productos/${idProductoPrueba}`,
      headers: { Authorization: `Bearer ${tokenCajero}` },
      failOnStatusCode: false
    }).then((resp) => {
      expect(resp.status, 'código HTTP del DELETE hecho por el cajero').to.eq(403)
    })
  })

  after(() => {
    // Limpieza: el administrador borra lo que haya quedado de la prueba
    ;[idProductoPrueba, ...idsParaLimpiar].forEach((idProducto) => {
      cy.request({
        method: 'DELETE',
        url: `${API}/productos/${idProducto}`,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        failOnStatusCode: false
      })
    })
  })
})