interface IndicadorStockProps {
  stockBajo: boolean;
}

export function IndicadorStock({ stockBajo }: IndicadorStockProps): JSX.Element {
  if (!stockBajo) {
    return <></>;
  }

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        'bg-red-100 text-red-700'
      ].join(' ')}
    >
      Stock bajo
    </span>
  );
}
