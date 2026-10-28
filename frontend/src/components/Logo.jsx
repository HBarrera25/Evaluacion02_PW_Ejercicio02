import React from 'react';

export default function Logo() {
  return (
    <span className="logo-food-dei">
      <img src={`${import.meta.env.BASE_URL}images/food-dei-logo.png`}
        alt="Food DEI" width="1536" height="1024" />
    </span>
  );
}
