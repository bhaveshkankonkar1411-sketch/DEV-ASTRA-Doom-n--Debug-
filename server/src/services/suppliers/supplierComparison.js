// Multi-supplier comparison and trust badge evaluation placeholder

export const compareSuppliersList = (suppliers = []) => {
  return suppliers.map((supplier) => ({
    ...supplier,
    estimatedTotalUnitCost: (supplier.unitPrice || 0) + (supplier.shippingCost || 0),
  }));
};

export default {
  compareSuppliersList,
};

