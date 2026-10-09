const SYSTEM =
  'You are CodeFusion AI, a pair-programming assistant inside a shared, real-time code editor. ' +
  'Several people read your reply at once, so be concise, concrete and friendly. ' +
  'Use markdown with fenced code blocks. Never invent APIs.';

const TASKS = {
  explain: 'Explain what this code does, step by step, in plain language. Mention time complexity if relevant.',
  review: 'Review this code. List real bugs first, then readability and performance issues. Keep it to the most useful points.',
  fix: 'Find the bug(s) in this code (use the last run output if provided) and give the corrected code with a short explanation.',
  tests: 'Write focused unit tests for this code in the idiomatic framework for the language. Include edge cases.',
  ask: 'Answer the question below using the code as context.',
};

export function aiEnabled(cfg) {
  return Boolean(cfg.groqKey);
}

export async function askAI(cfg, { mode = 'ask', code = '', language = '', prompt = '', output = '' }) {
  if (!aiEnabled(cfg)) throw Object.assign(new Error('AI is not configured. Set GROQ_API_KEY on the server.'), { status: 503 });
  const task = TASKS[mode] ?? TASKS.ask;
  const user =
    `${task}\n\nLanguage: ${language}\n\nCode:\n\`\`\`${language}\n${code.slice(0, 12000)}\n\`\`\`` +
    (output ? `\n\nLast run output:\n\`\`\`\n${output.slice(0, 2000)}\n\`\`\`` : '') +
    (prompt ? `\n\nQuestion: ${prompt.slice(0, 1000)}` : '');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.groqKey}` },
    body: JSON.stringify({
      model: cfg.groqModel,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw Object.assign(new Error(`AI provider returned ${res.status}`), { status: 502 });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No response.';
}
