import { createServer } from './server.js';

const server = createServer();
const port = await server.listen();
const { cfg } = server;

console.log(`CodeFusion listening on :${port}`);
console.log(`  data dir     ${cfg.dataDir}`);
console.log(`  code runner  ${cfg.pistonUrl ? 'piston' : cfg.enableLocalExec ? 'local (not sandboxed)' : 'browser JS only'}`);
console.log(`  AI           ${cfg.groqKey ? cfg.groqModel : 'disabled (no GROQ_API_KEY)'}`);

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close().then(() => process.exit(0)));
