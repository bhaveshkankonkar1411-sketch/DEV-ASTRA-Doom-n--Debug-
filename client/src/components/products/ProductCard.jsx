export const ProductCard = ({ product, onSelect }) => {
  if (!product) return null;

  return (
    <article className="panel product-card">
      <h2>{product.name}</h2>
      <p>{product.category}</p>
      {product.price != null && <strong>₹{Number(product.price).toLocaleString('en-IN')}</strong>}
      {onSelect && (
        <button className="secondary full" onClick={() => onSelect(product)}>
          Explore product
        </button>
      )}
    </article>
  );
};

export default ProductCard;

