import React from 'react';

export const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      {/* Product card placeholder */}
      <h3>{product?.name || 'Product Title'}</h3>
      <p>{product?.category || 'Category'}</p>
    </div>
  );
};

export default ProductCard;

