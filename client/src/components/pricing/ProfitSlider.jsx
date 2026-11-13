import React from 'react';

export const ProfitSlider = ({ value, min = 0, max = 500, onChange }) => {
  return (
    <div className="profit-slider-container">
      <label htmlFor="price-slider">Target Selling Price</label>
      <input
        id="price-slider"
        type="range"
        min={min}
        max={max}
        value={value || min}
        onChange={onChange}
      />
    </div>
  );
};

export default ProfitSlider;

