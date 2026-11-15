import React from 'react';
import { initials } from '../lib/utils';

export default function Avatar({ name, color = '#8b7cff', size = 28, ring = false, title }) {
  return (
    <span
      className="avatar"
      title={title || name}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 62%, #000))`,
        boxShadow: ring ? `0 0 0 2px var(--bg-1), 0 0 0 3.5px ${color}` : undefined,
      }}
    >
      {initials(name)}
    </span>
  );
}
