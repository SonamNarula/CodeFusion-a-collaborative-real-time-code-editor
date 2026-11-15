import React from 'react';
import { Zap } from 'lucide-react';

export default function Logo({ size = 30, text = true }) {
  return (
    <span className="logo">
      <span className="logo-mark" style={{ width: size, height: size, borderRadius: size * 0.3 }}>
        <Zap size={size * 0.52} strokeWidth={2.6} fill="currentColor" />
      </span>
      {text && <span className="logo-text">Code<b>Fusion</b></span>}
    </span>
  );
}
