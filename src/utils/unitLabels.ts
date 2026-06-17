export interface UnitConfig {
  unitType?: string;
  unitSize?: number | string;
  unit?: string;
  compoundSize?: number | string;
  sizeUnit?: string;
  container?: string;
  quantity?: number | string;
}

export function computeUnitLabels(config: UnitConfig): { unitQtyLabel: string; totalQtyLabel: string } {
  const qty = Number(config.quantity) || 0;

  if (config.unitType === 'compound') {
    const size = Number(config.compoundSize) || 1;
    const su = config.sizeUnit || 'ml';
    const cont = config.container || 'Bottle';
    const sizeStr = Number.isInteger(size) ? String(size) : String(size);
    return {
      unitQtyLabel: `${sizeStr} ${su} ${cont}`,
      totalQtyLabel: `${sizeStr} ${su} × ${qty} ${cont}`,
    };
  }

  const size = Number(config.unitSize) || 1;
  const unit = config.unit || 'PCS';
  const totalNum = size * qty;
  const totalStr = Number.isInteger(totalNum)
    ? String(totalNum)
    : String(parseFloat(totalNum.toFixed(6)));
  return {
    unitQtyLabel: `${size} ${unit}`,
    totalQtyLabel: `${totalStr} ${unit}`,
  };
}

export function legacyUnitQtyDisplay(item: {
  unitQtyLabel?: string;
  unitQty?: number;
  unit?: string;
}): string {
  return item.unitQtyLabel || `${item.unitQty ?? ''} ${item.unit ?? 'PCS'}`.trim();
}

export function legacyTotalQtyDisplay(item: {
  totalQtyLabel?: string;
  totalQty?: number;
  totalUnit?: string;
  unit?: string;
}): string {
  return item.totalQtyLabel || `${item.totalQty ?? ''} ${item.totalUnit ?? item.unit ?? 'PCS'}`.trim();
}
