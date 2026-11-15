import React from 'react';

/** Draggable divider. `onDrag(delta)` is called with incremental pixel deltas. */
export default function Splitter({ dir = 'x', onDrag }) {
  const down = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    let last = dir === 'x' ? e.clientX : e.clientY;
    document.body.classList.add('resizing', dir);
    const move = (ev) => {
      const cur = dir === 'x' ? ev.clientX : ev.clientY;
      onDrag(cur - last);
      last = cur;
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      document.body.classList.remove('resizing', 'x', 'y');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };
  return <div className={`splitter ${dir}`} onPointerDown={down} role="separator" />;
}
