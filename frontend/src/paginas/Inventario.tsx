import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Boton } from '../componentes/Boton';
import { IndicadorStock } from '../componentes/IndicadorStock';
import { Modal } from '../componentes/Modal';
import { EstadoCargando } from '../componentes/EstadoCargando';
import { EstadoError } from '../componentes/EstadoError';
import { EstadoVacio } from '../componentes/EstadoVacio';
import { formatearMonedaColombiana } from '../servicios/formato';
import { escucharVentaRegistrada } from '../servicios/eventos';
import * as productosServicio from '../servicios/productosServicio';
import type { CategoriaProducto, Producto } from '../tipos/modelos';

interface ErroresFormularioProducto {
  nombre?: string;
  precio?: string;
  stock?: string;
  stockMinimo?: string;
  categoria?: string;
  imagenUrl?: string;
}

interface FormularioProducto {
  nombre: string;
  codigoProducto: string;
  precio: string;
  stock: string;
  stockMinimo: string;
  categoria: string;
  imagenUrl: string;
}

interface FormularioCategoria {
  nombre: string;
}

interface CategoriaEnEdicion {
  id: string;
  nombre: string;
}

interface CategoriaAEliminar {
  id: string;
  nombre: string;
}

const formularioProductoInicial = (): FormularioProducto => ({
  nombre: '',
  codigoProducto: generarCodigoProducto(),
  precio: '',
  stock: '',
  stockMinimo: '',
  categoria: '',
  imagenUrl: ''
});

const formularioCategoriaInicial = (): FormularioCategoria => ({
  nombre: ''
});

const normalizarTexto = (valor: string): string => valor.trim().toUpperCase();

//genero el codigo aleatroiamente 

const generarCodigoProducto = (): string => {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefijo = letras[Math.floor(Math.random() * letras.length)] + letras[Math.floor(Math.random() * letras.length)];
  const numeros = Math.floor(1000 + Math.random() * 9000);
  return `${prefijo}-${numeros}`;
};



const parseMoneda = (valor: string): number | null => {
  const limpio = valor.replace(/\D/g, '');
  if (limpio.length === 0) return null;
  return Number(limpio);
};

const formatearMonedaInput = (valor: string): string => {
  const numero = parseMoneda(valor);
  if (numero === null) return '';
  return new Intl.NumberFormat('es-CO').format(numero);
};

const stockEsBajo = (producto: Producto): boolean => producto.stock < producto.stockMinimo;

export function Inventario(): JSX.Element {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [verCategoriasAbierto, setVerCategoriasAbierto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<Producto | null>(null);
  const [formulario, setFormulario] = useState<FormularioProducto>(formularioProductoInicial());
  const [formularioCategoria, setFormularioCategoria] = useState<FormularioCategoria>(formularioCategoriaInicial());
  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState<CategoriaEnEdicion | null>(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<CategoriaAEliminar | null>(null);
  const [errores, setErrores] = useState<ErroresFormularioProducto>({});
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  //agrego un estado para manejar la imagen prevista al subir una nueva imagen o editarla, esto me permite mostrar una vista previa antes de guardar el producto y también limpiar la vista previa al cerrar el modal.
  const [previstaImagen, setPrevistaImagen] = useState<string>('');

  const cargar = async (): Promise<void> => {
    try {
      setError(null);
      setCargando(true);
      const [productosObtenidos, categoriasObtenidas] = await Promise.all([productosServicio.obtenerTodos(), productosServicio.obtenerCategorias()]);
      setProductos(productosObtenidos);
      setCategorias(categoriasObtenidas);
    } catch (errorInterno: unknown) {
      const mensaje = errorInterno instanceof Error ? errorInterno.message : 'No se pudieron cargar los datos.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  useEffect(() => escucharVentaRegistrada(() => void cargar()), []);

  useEffect(() => {
  if (!modalProductoAbierto) {
    setFormulario(formularioProductoInicial());
    setErrores({});
    setErrorFormulario(null);
    setProductoEnEdicion(null);
    setPrevistaImagen('');
  }
}, [modalProductoAbierto]);

  useEffect(() => {
    if (!modalCategoriaAbierto) {
      setFormularioCategoria(formularioCategoriaInicial());
      setCategoriaEnEdicion(null);
    }
  }, [modalCategoriaAbierto]);

  useEffect(() => {
    if (!categoriaAEliminar) {
      return;
    }

    const categoriaExiste = categorias.some((categoria) => categoria.id === categoriaAEliminar.id);
    if (!categoriaExiste) {
      setCategoriaAEliminar(null);
    }
  }, [categoriaAEliminar, categorias]);

  const categoriasOrdenadas = useMemo(() => [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [categorias]);

  const categoriasFiltradas = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideBusqueda =
        textoBusqueda.length === 0 ||
        producto.nombre.toLowerCase().includes(textoBusqueda) ||
        producto.categoria.toLowerCase().includes(textoBusqueda) ||
        producto.codigoProducto?.toLowerCase().includes(textoBusqueda) === true;

      const coincideCategoria = categoriaSeleccionada === 'Todas' || producto.categoria === categoriaSeleccionada;
      return coincideBusqueda && coincideCategoria;
    });
  }, [busqueda, categoriaSeleccionada, productos]);

  const abrirNuevoProducto = (): void => {
    setProductoEnEdicion(null);
    setFormulario(formularioProductoInicial());
    setErrores({});
  
    
    setModalProductoAbierto(true);
  };

  const abrirEdicion = (producto: Producto): void => {
    setProductoEnEdicion(producto);
    setFormulario({
      nombre: producto.nombre,
      codigoProducto: producto.codigoProducto ?? '',
      precio: new Intl.NumberFormat('es-CO').format(producto.precio),
      stock: `${producto.stock}`,
      stockMinimo: `${producto.stockMinimo}`,
      categoria: producto.categoria,
      imagenUrl: producto.imagenUrl
    });
    setErrores({});
    setModalProductoAbierto(true);
  };

  const validarFormulario = (): ErroresFormularioProducto => {
    const nuevosErrores: ErroresFormularioProducto = {};
    const precio = parseMoneda(formulario.precio);
    const stock = parseMoneda(formulario.stock);
    const stockMinimo = parseMoneda(formulario.stockMinimo);

    if (formulario.nombre.trim().length === 0) nuevosErrores.nombre = 'El nombre es obligatorio.';
    if (precio === null || precio <= 0) nuevosErrores.precio = 'El precio debe ser mayor que cero.';
    if (stock === null || stock < 0) nuevosErrores.stock = 'El stock debe ser igual o mayor que cero.';
    if (stockMinimo === null || stockMinimo < 0) nuevosErrores.stockMinimo = 'El stock mínimo debe ser igual o mayor que cero.';
    if (formulario.categoria.trim().length === 0) nuevosErrores.categoria = 'La categoría es obligatoria.';
    if (formulario.imagenUrl.trim().length === 0) nuevosErrores.imagenUrl = 'La imagen es obligatoria.';

    return nuevosErrores;
  };

  const guardarProducto = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();

    const nuevosErrores = validarFormulario();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const precio = parseMoneda(formulario.precio) ?? 0;
    const stock = parseMoneda(formulario.stock) ?? 0;
    const stockMinimo = parseMoneda(formulario.stockMinimo) ?? 0;
    const codigoProducto = formulario.codigoProducto.trim().toUpperCase();
    const categoria = normalizarTexto(formulario.categoria);

    if (codigoProducto.length > 0) {
      const codigoDuplicado = productos.some((producto) => producto.codigoProducto?.toUpperCase() === codigoProducto && producto.id !== productoEnEdicion?.id);
      if (codigoDuplicado) {
        setErrorFormulario('Ya existe un producto con ese código en esta tienda.');
        return;
      }
    }

    try {
      setErrorFormulario(null);
      setGuardando(true);
      const datos = {
        nombre: formulario.nombre.trim(),
        ...(codigoProducto.length > 0 ? { codigoProducto } : {}),
        precio,
        stock,
        stockMinimo,
        categoria,
        imagenUrl: formulario.imagenUrl.trim(),
        fechaActualizacion: new Date().toISOString()
      };

      if (productoEnEdicion !== null) {
        await productosServicio.actualizar(productoEnEdicion.id, datos);
      } else {
        await productosServicio.crear(datos);
      }

      await cargar();
      setModalProductoAbierto(false);
    } catch (errorInterno: unknown) {
      setErrorFormulario(errorInterno instanceof Error ? errorInterno.message : 'No se pudo guardar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarCategoria = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();

    const nombre = normalizarTexto(formularioCategoria.nombre);
    if (nombre.length === 0) return;

    try {
      setGuardando(true);
      if (categoriaEnEdicion !== null) {
        await productosServicio.actualizarCategoria(categoriaEnEdicion.id, nombre);
      } else {
        await productosServicio.crearCategoria(nombre);
      }
      setModalCategoriaAbierto(false);
      await cargar();
    } catch (errorInterno: unknown) {
      setError(errorInterno instanceof Error ? errorInterno.message : 'No se pudo crear la categoría.');
    } finally {
      setGuardando(false);
    }
  };

  const actualizarCampoMoneda = (campo: 'precio' | 'stock' | 'stockMinimo') => (evento: ChangeEvent<HTMLInputElement>): void => {
    const valor = evento.target.value;
    const formateado = campo === 'precio' ? formatearMonedaInput(valor) : valor.replace(/\D/g, '');
    setFormulario((anterior) => ({ ...anterior, [campo]: formateado }));
  };

  const categoriasVisibles = categoriasOrdenadas.filter((categoria) => categoria.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));

  const abrirEdicionCategoria = (categoria: CategoriaProducto): void => {
    setVerCategoriasAbierto(false);
    setCategoriaEnEdicion({ id: categoria.id, nombre: categoria.nombre });
    setFormularioCategoria({ nombre: categoria.nombre });
    setModalCategoriaAbierto(true);
  };

  const abrirEliminacionCategoria = (categoria: CategoriaProducto): void => {
    setVerCategoriasAbierto(false);
    setCategoriaAEliminar({ id: categoria.id, nombre: categoria.nombre });
  };

  const confirmarEliminarCategoria = async (): Promise<void> => {
    if (categoriaAEliminar === null) {
      return;
    }

    try {
      setGuardando(true);
      await productosServicio.eliminarCategoria(categoriaAEliminar.id);
      setCategoriaAEliminar(null);
      await cargar();
    } catch (errorInterno: unknown) {
      setError(errorInterno instanceof Error ? errorInterno.message : 'No se pudo eliminar la categoría.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <EstadoCargando />;
  if (error !== null) return <EstadoError mensaje={error} alReintentar={() => void cargar()} />;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primario">Inventario</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900">Gestión de productos</h1>
            <p className="mt-2 text-sm text-slate-500">Crea, filtra y edita productos con categorías y stock mínimo por artículo.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Boton variante="contorno" onClick={() => setVerCategoriasAbierto(true)}>Ver categorías</Boton>
            <Boton variante="secundario" onClick={() => setModalCategoriaAbierto(true)}>Crear categoría</Boton>
            <Boton variante="primario" onClick={abrirNuevoProducto}>Agregar producto</Boton>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Buscador</span>
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por nombre, categoría o código" />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Categoría</span>
          <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={categoriaSeleccionada} onChange={(evento) => setCategoriaSeleccionada(evento.target.value)}>
            <option value="Todas">Todas</option>
            {categoriasOrdenadas.map((categoria) => (
              <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      {categoriasFiltradas.length === 0 ? (
        <EstadoVacio titulo="No hay productos" descripcion="No existen productos que coincidan con el filtro actual." />
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Imagen</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Código</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Categoría</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Precio</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stock</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {categoriasFiltradas.map((producto) => {
                  const bajo = stockEsBajo(producto);

                  return (
                    <tr key={producto.id} className={bajo ? 'bg-red-50/60' : ''}>
                      <td className="px-5 py-4">
                        <img src={producto.imagenUrl} alt={producto.nombre} className="h-14 w-14 rounded-2xl border border-slate-200 object-cover" />
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{producto.codigoProducto ?? 'Sin código'}</td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{producto.nombre}</p>
                          <p className="text-xs text-slate-500">Actualizado {new Date(producto.fechaActualizacion).toLocaleDateString('es-CO')}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{producto.categoria}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatearMonedaColombiana(producto.precio)}</td>
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-slate-900">{producto.stock} unidades</div>
                          <IndicadorStock stockBajo={bajo} />
                          <div className="text-xs text-slate-500">Mínimo: {producto.stockMinimo}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Boton variante="contorno" tamano="pequeno" onClick={() => abrirEdicion(producto)}>Editar</Boton>
                          <Boton variante="peligro" tamano="pequeno" onClick={() => void productosServicio.eliminar(producto.id).then(() => void cargar())}>Eliminar</Boton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal abierto={modalProductoAbierto} titulo={productoEnEdicion ? 'Editar producto' : 'Agregar producto'} subtitulo="Todos los campos quedan con borde y foco visible." alCerrar={() => setModalProductoAbierto(false)} anchoMaximo="xl">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={guardarProducto}>
          {errorFormulario ? <div className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorFormulario}</div> : null}
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Nombre</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={formulario.nombre} onChange={(evento) => setFormulario((anterior) => ({ ...anterior, nombre: evento.target.value }))} />
            {errores.nombre ? <p className="mt-2 text-xs font-medium text-red-600">{errores.nombre}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Código</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={formulario.codigoProducto} onChange={(evento) => setFormulario((anterior) => ({ ...anterior, codigoProducto: evento.target.value }))} placeholder="A-001" />
            {errorFormulario ? <p className="mt-2 text-xs font-medium text-red-600">{errorFormulario}</p> : null}
          </label>

          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Categoría</span>
              <input list="lista-categorias" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={formulario.categoria} onChange={(evento) => setFormulario((anterior) => ({ ...anterior, categoria: evento.target.value }))} placeholder="Busca o escribe una categoría" />
              <datalist id="lista-categorias">
                {categoriasOrdenadas.map((categoria) => (
                  <option key={categoria.id} value={categoria.nombre} />
                ))}
              </datalist>
              {errores.categoria ? <p className="mt-2 text-xs font-medium text-red-600">{errores.categoria}</p> : null}
            </label>
            <div className="flex items-end">
              <Boton variante="secundario" onClick={() => setModalCategoriaAbierto(true)}>Crear categoría</Boton>
            </div>
          </div>



          <div className="sm:col-span-2">
  <span className="mb-2 block text-sm font-semibold text-slate-700">Imagen del producto</span>
  <label
    className="flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center cursor-pointer hover:border-primario hover:bg-blue-50 transition-colors"
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => {
      e.preventDefault();
      const archivo = e.dataTransfer.files[0];
      if (!archivo) return;
      const lector = new FileReader();
      lector.onload = () => {
        const base64 = lector.result as string;
        setPrevistaImagen(base64);
        setFormulario((anterior) => ({ ...anterior, imagenUrl: base64 }));
      };
      lector.readAsDataURL(archivo);
    }}
  >
    {(previstaImagen || formulario.imagenUrl) ? (
      <img
        src={previstaImagen || formulario.imagenUrl}
        alt="Vista previa"
        className="h-32 w-32 rounded-2xl object-cover border border-slate-200 mb-3"
      />
    ) : (
      <div className="text-slate-400 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium">Arrastra una imagen aquí</p>
        <p className="text-xs text-slate-400 mt-1">o haz clic para seleccionar</p>
      </div>
    )}
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(evento) => {
        const archivo = evento.target.files?.[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = () => {
          const base64 = lector.result as string;
          setPrevistaImagen(base64);
          setFormulario((anterior) => ({ ...anterior, imagenUrl: base64 }));
        };
        lector.readAsDataURL(archivo);
      }}
    />
  </label>
  {errores.imagenUrl ? <p className="mt-2 text-xs font-medium text-red-600">{errores.imagenUrl}</p> : null}
</div>



          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Precio</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={formulario.precio} onChange={actualizarCampoMoneda('precio')} inputMode="numeric" placeholder="0" />
            {errores.precio ? <p className="mt-2 text-xs font-medium text-red-600">{errores.precio}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Stock</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={formulario.stock} onChange={actualizarCampoMoneda('stock')} inputMode="numeric" placeholder="0" />
            {errores.stock ? <p className="mt-2 text-xs font-medium text-red-600">{errores.stock}</p> : null}
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Stock mínimo para este producto</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={formulario.stockMinimo} onChange={actualizarCampoMoneda('stockMinimo')} inputMode="numeric" placeholder="10" />
            {errores.stockMinimo ? <p className="mt-2 text-xs font-medium text-red-600">{errores.stockMinimo}</p> : null}
          </label>

          <div className="sm:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Boton variante="secundario" onClick={() => setModalProductoAbierto(false)}>Cancelar</Boton>
            <Boton variante="primario" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar producto'}</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={modalCategoriaAbierto} titulo={categoriaEnEdicion ? 'Editar categoría' : 'Crear categoría'} subtitulo="Las categorías se guardan en mayúscula y sin duplicados." alCerrar={() => setModalCategoriaAbierto(false)} anchoMaximo="md">
        <form className="space-y-4" onSubmit={guardarCategoria}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Nombre categoría</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primario focus:ring-4 focus:ring-blue-100" value={formularioCategoria.nombre} onChange={(evento) => setFormularioCategoria({ nombre: evento.target.value })} placeholder="NOMBRE CATEGORÍA" />
          </label>
          <div className="flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setModalCategoriaAbierto(false)}>Cancelar</Boton>
            <Boton variante="primario" type="submit" disabled={guardando}>{guardando ? (categoriaEnEdicion ? 'Guardando...' : 'Creando...') : (categoriaEnEdicion ? 'Guardar cambios' : 'Crear categoría')}</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={verCategoriasAbierto} titulo="Categorías registradas" subtitulo="Organizadas de A a Z." alCerrar={() => setVerCategoriasAbierto(false)} anchoMaximo="lg">
        <div className="space-y-3">
          {categoriasOrdenadas.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay categorías creadas.</p>
          ) : (
            categoriasVisibles.map((categoria) => (
                <div key={categoria.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <span className="font-semibold text-slate-900">{categoria.nombre}</span>
                    <p className="text-xs text-slate-500">{new Date(categoria.fechaCreacion).toLocaleDateString('es-CO')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Boton variante="contorno" tamano="pequeno" onClick={() => abrirEdicionCategoria(categoria)}>Editar</Boton>
                    <Boton variante="peligro" tamano="pequeno" onClick={() => abrirEliminacionCategoria(categoria)}>Eliminar</Boton>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>

      <Modal abierto={categoriaAEliminar !== null} titulo="Eliminar categoría" subtitulo="Confirma la eliminación antes de continuar." alCerrar={() => setCategoriaAEliminar(null)} anchoMaximo="md" bloquearCierre>
        {categoriaAEliminar ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a eliminar <span className="font-semibold text-slate-900">{categoriaAEliminar.nombre}</span>.
            </p>
            <div className="flex justify-end gap-3">
              <Boton variante="secundario" onClick={() => setCategoriaAEliminar(null)}>Cancelar</Boton>
              <Boton variante="peligro" onClick={() => void confirmarEliminarCategoria()} disabled={guardando}>{guardando ? 'Eliminando...' : 'Eliminar categoría'}</Boton>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
