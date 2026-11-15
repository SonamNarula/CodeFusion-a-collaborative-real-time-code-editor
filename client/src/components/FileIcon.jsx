import React from 'react';
import { FILE_BADGE, extOf } from '../lib/utils';

export default function FileIcon({ name }) {
  const [label, color] = FILE_BADGE[extOf(name)] || ['TXT', '#8b93a8'];
  return (
    <span className="file-icon" style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
      {label}
    </span>
  );
}
