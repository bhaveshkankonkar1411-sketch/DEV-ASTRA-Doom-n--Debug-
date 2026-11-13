import React from 'react';

export const TrustBadge = ({ tier = 'VERIFIED' }) => {
  return (
    <span className={`trust-badge trust-badge-${tier.toLowerCase()}`}>
      {tier}
    </span>
  );
};

export default TrustBadge;

