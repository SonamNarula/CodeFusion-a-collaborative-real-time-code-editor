const BRIDGE = `<script>(function(){function s(t,a){try{parent.postMessage({__cfPreview:true,type:t,text:a.map(function(x){try{return typeof x==='string'?x:(x instanceof Error?x.message:JSON.stringify(x))}catch(e){return String(x)}}).join(' ')},'*')}catch(e){}}['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){s(k,[].slice.call(arguments));o.apply(console,arguments)}});window.addEventListener('error',function(e){s('error',[e.message+' (line '+e.lineno+')'])});window.addEventListener('unhandledrejection',function(e){s('error',['Unhandled rejection: '+(e.reason&&e.reason.message||e.reason)])});})();</script>`;

const strip = (p) => p.replace(/^\.?\//, '').split(/[?#]/)[0];

/** Inlines linked CSS/JS from workspace files into the entry HTML. Returns null when there is no HTML file. */
export function buildPreview(files, getText) {
  const entry = files.find((f) => f.name.toLowerCase() === 'index.html') || files.find((f) => /\.html?$/i.test(f.name));
  if (!entry) return null;
  const byName = Object.fromEntries(files.map((f) => [f.name, f]));
  let html = getText(entry.id);

  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel=["']?stylesheet/i.test(tag)) return tag;
    const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
    const file = href && byName[strip(href)];
    return file ? `<style data-file="${file.name}">${getText(file.id).replace(/<\/style/gi, '<\\/style')}</style>` : tag;
  });

  html = html.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a, src, b) => {
    const file = byName[strip(src)];
    return file ? `<script${a}${b}>${getText(file.id).replace(/<\/script/gi, '<\\/script')}</script>` : tag;
  });

  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + BRIDGE) : BRIDGE + html;
}
