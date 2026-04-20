import type { Producto } from '../tipos/modelos';
import { formatearMonedaColombiana } from '../servicios/formato';
import { Boton } from './Boton';
import { IndicadorStock } from './IndicadorStock';

interface TarjetaProductoProps {
  producto: Producto;
  alAgregar: (producto: Producto) => void;
}

export function TarjetaProducto({ producto, alAgregar }: TarjetaProductoProps): JSX.Element {
  const sinStock = producto.stock <= 0;
  const stockBajo = producto.stock < producto.stockMinimo;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={producto.imagenUrl} alt={producto.nombre} className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-2 text-sm font-bold text-slate-900">{producto.nombre}</h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{producto.categoria}</p>
          </div>
          <IndicadorStock stockBajo={stockBajo} />
        </div>

        <p className="mt-2 text-xs text-slate-500">Código: {producto.codigoProducto ?? 'Sin código'}</p>
        <p className="mt-1 text-xs text-slate-500">Stock mínimo: {producto.stockMinimo}</p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Precio</p>
            <p className="text-base font-extrabold text-slate-900">{formatearMonedaColombiana(producto.precio)}</p>
          </div>

          <Boton
            tamano="pequeno"
            variante="primario"
            onClick={() => alAgregar(producto)}
            disabled={sinStock}
          >
            + Agregar
          </Boton>
        </div>

        {sinStock ? <p className="mt-3 text-xs font-medium text-red-600">Sin existencias para vender</p> : stockBajo ? <p className="mt-3 text-xs font-medium text-amber-700">Por debajo del mínimo configurado</p> : null}
      </div>
    </article>
  );
}
