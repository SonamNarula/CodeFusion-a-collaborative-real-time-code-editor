import React from 'react';
import { HEX_RE } from '../lib/utils';

/** Generates per-collaborator CSS for the cursors/selections that y-monaco renders. */
export default function RemoteCursorStyles({ peers }) {
  const css = peers
    .filter((p) => !p.isSelf)
    .map((p) => {
      const c = HEX_RE.test(p.user.color) ? p.user.color : '#8b7cff';
      const n = String(p.user.name || 'Guest').replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 18);
      const id = p.clientId;
      return [
        `.yRemoteSelection-${id}{background:${c}38}`,
        `.yRemoteSelectionHead-${id}{position:absolute;border-left:2px solid ${c};height:100%;box-sizing:border-box}`,
        `.yRemoteSelectionHead-${id}::before{content:"${n}";position:absolute;top:-19px;left:-2px;padding:1px 7px;border-radius:5px 5px 5px 0;background:${c};color:#090a10;font:600 10.5px/16px Inter,system-ui,sans-serif;white-space:nowrap;pointer-events:none;z-index:20}`,
      ].join('');
    })
    .join('\n');
  return <style>{css}</style>;
}
