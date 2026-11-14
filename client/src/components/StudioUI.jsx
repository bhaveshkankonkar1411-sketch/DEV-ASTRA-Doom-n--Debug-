import { useEffect, useId, useRef, useState } from 'react';
export const money = value => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(value);
export const initials = name => (name || 'Drop Pilot').split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
export const plans = ['Starter', 'Growth Plan', 'Enterprise AI'];
export const navigation = [['home', 'Home', 'home'], ['overview', 'Overview', 'grid'], ['discover', 'Product discovery', 'compass'], ['listing', 'Listing studio', 'file'], ['suppliers', 'Supplier comparison', 'box'], ['pricing', 'Smart pricing', 'sliders'], ['content', 'Content generator', 'spark'], ['shopify', 'Shopify sync', 'bag'], ['goals', 'Profit goal planner', 'target'], ['recovery', 'Goal recovery', 'pulse']];
export const designatedProductImages = [
  { keywords: ['neck', 'fan'], image: '/assets/products/bladeless-neck-fan.png' },
  { keywords: ['posture', 'brace', 'corrector'], image: '/assets/products/smart-posture-corrector.png' },
  { keywords: ['sunset', 'lamp', 'projector', 'galaxy'], image: '/assets/products/sunset-projection-lamp.png' },
  { keywords: ['pet', 'glove', 'brush', 'groom'], image: '/assets/products/pet-grooming-brush.png' },
  { keywords: ['espresso', 'coffee'], image: '/assets/products/portable-espresso-maker.png' }
];

export function designatedImageFor(product) {
  if (!product) return null;
  const identity = `${product.id || ''} ${product.name || ''} ${product.title || ''} ${product.category || ''}`.toLowerCase();
  const match = designatedProductImages.find(({ keywords }) => keywords.some(keyword => identity.includes(keyword)));
  return match?.image || product.imageUrl || product.image || null;
}
export const products = [{
  id: 'fan',
  name: 'Portable Neck Fan',
  category: 'Summer essentials',
  cost: 449,
  price: 1199,
  orders: 2400,
  score: 92,
  icon: 'fan',
  color: 'violet',
  trend: 'Trending',
  features: 'Hands-free wearable design\nThree adjustable speeds\nUSB-C rechargeable battery'
}, {
  id: 'brace',
  name: 'Posture Support Brace',
  category: 'Health & wellness',
  cost: 380,
  price: 999,
  orders: 1800,
  score: 88,
  icon: 'pulse',
  color: 'mint',
  trend: 'High margin',
  features: 'Adjustable straps\nLightweight design\nWearable support'
}, {
  id: 'lamp',
  name: 'Galaxy Projector Lamp',
  category: 'Home & lifestyle',
  cost: 690,
  price: 1599,
  orders: 1200,
  score: 84,
  icon: 'spark',
  color: 'peach',
  trend: 'Rising',
  features: 'Galaxy light projection\nAdjustable lighting\nCompact design'
}, {
  id: 'glove',
  name: 'Pet Grooming Glove',
  category: 'Pet care',
  cost: 220,
  price: 699,
  orders: 3100,
  score: 81,
  icon: 'heart',
  color: 'blue',
  trend: 'Best seller',
  features: 'Flexible grooming surface\nAdjustable wrist strap\nReusable design'
}];
export const suppliers = [{
  name: 'QuickCart Direct',
  cost: 449,
  days: 7,
  rating: 4.8
}, {
  name: 'SourceBridge',
  cost: 425,
  days: 12,
  rating: 4.5
}, {
  name: 'ShipHalo',
  cost: 480,
  days: 5,
  rating: 4.9
}];
export function Icon({
  name,
  size = 20,
  ...props
}) {
  const paths = {
    home: 'M3 10 12 3l9 7v10h-6v-6H9v6H3z',
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    compass: 'm16 8-3 5-5 3 3-5z M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    file: 'M14 3H5v18h14V8z M14 3v5h5 M8 12h8 M8 16h6',
    box: 'm12 3 9 5v9l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v9 M8 5l9 5',
    sliders: 'M4 5h16 M4 12h16 M4 19h16 M8 2v6 M16 9v6 M10 16v6',
    spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z',
    bag: 'M5 7h14l2 14H3z M8 8V6a4 4 0 0 1 8 0v2',
    target: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M12 10v4 M10 12h4',
    pulse: 'M2 12h5l3-8 4 16 3-8h5',
    search: 'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    arrow: 'M5 12h14 m-6-6 6 6-6 6',
    up: 'M5 16 16 5 M5 5h11v11',
    down: 'm6 9 6 6 6-6',
    plus: 'M12 5v14 M5 12h14',
    close: 'm6 6 12 12 M6 18 18 6',
    sun: 'M12 1v2 M12 21v2 M1 12h2 M21 12h2 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
    moon: 'M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13',
    bell: 'M6 8a6 6 0 0 1 12 0v7l2 3H4l2-3z M10 21h4',
    menu: 'M4 6h16 M4 12h16 M4 18h16',
    check: 'm5 12 4 4L19 6',
    logout: 'M9 4H4v16h5 M9 12h12 m-5-5 5 5-5 5',
    user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
    wallet: 'M3 5h17v15H3z M3 5V3h14 M16 11h5v5h-5z',
    fan: 'M12 12c-12 0-10-10-4-9 4 0 5 5 4 9 0-12 10-10 9-4 0 4-5 5-9 4 12 0 10 10 4 9-4 0-5-5-4-9 0 12-10 10-9 4 0-4 5-5 9-4',
    heart: 'M12 21 3 12C-3 4 8-1 12 6c4-7 15-2 9 6z'
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.spark} /></svg>;
}
export function useStored(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}
export function Count({
  value,
  format = v => Math.round(v).toLocaleString('en-IN')
}) {
  const [current, setCurrent] = useState(value);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(value);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / 1100, 1);
      setCurrent(value * (1 - Math.pow(1 - p, 4)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{format(current)}</>;
}
export function Modal({
  title,
  children,
  onClose,
  wide = false
}) {
  const ref = useRef(null),
    id = useId(),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input,button,select,textarea')?.focus();
    const key = e => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const items = [...ref.current.querySelectorAll('button,input,select,textarea,a[href]')].filter(el => !el.disabled);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener('keydown', key);
      prev?.focus();
    };
  }, []);
  return <div className="modal-backdrop" onMouseDown={e => {
    if (e.target === e.currentTarget) onClose();
  }}><section ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className={`modal glass ${wide ? 'wide' : ''}`}><div className="section-head"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button></div>{children}</section></div>;
}
export function Field({
  label,
  ...props
}) {
  return <label className="form-field"><span>{label}</span><input {...props} /></label>;
}
export function PageHead({
  eyebrow,
  title,
  description,
  action
}) {
  return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
export function ProductArt({
  product,
  small = false
}) {
  const image = designatedImageFor(product);
  if (image) {
    return (
      <div className={`product-art product-photo ${product?.color || ''} ${small ? 'small' : ''}`}>
        <img src={image} alt={product?.name || product?.title || 'Product'} loading="lazy" />
      </div>
    );
  }
  return <div className={`product-art ${product?.color || 'peach'} ${small ? 'small' : ''}`}><Icon name={product?.icon || 'box'} size={small ? 26 : 76} />{!small && <span className="art-orbit" />}</div>;
}
