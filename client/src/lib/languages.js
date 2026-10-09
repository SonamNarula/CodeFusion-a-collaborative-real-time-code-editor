export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'c', label: 'C', ext: 'c' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'go', label: 'Go', ext: 'go' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
];

export const langInfo = (id) => LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];

export const TEMPLATES = {
  javascript: `// Welcome to CodeFusion. Everyone in this room edits the same file.\nfunction fib(n) {\n  return n < 2 ? n : fib(n - 1) + fib(n - 2);\n}\n\nconsole.log('fib(10) =', fib(10));\n`,
  typescript: `const greet = (name: string): string => \`Hello, \${name}!\`;\nconsole.log(greet('CodeFusion'));\n`,
  python: `# Welcome to CodeFusion. Everyone in this room edits the same file.\ndef fib(n):\n    return n if n < 2 else fib(n - 1) + fib(n - 2)\n\nprint("fib(10) =", fib(10))\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }\n\nint main() {\n    cout << "fib(10) = " << fib(10) << endl;\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }\n\nint main(void) {\n    printf("fib(10) = %d\\n", fib(10));\n    return 0;\n}\n`,
  java: `public class Main {\n    static int fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }\n\n    public static void main(String[] args) {\n        System.out.println("fib(10) = " + fib(10));\n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc fib(n int) int {\n\tif n < 2 {\n\t\treturn n\n\t}\n\treturn fib(n-1) + fib(n-2)\n}\n\nfunc main() {\n\tfmt.Println("fib(10) =", fib(10))\n}\n`,
  rust: `fn fib(n: u32) -> u32 {\n    if n < 2 { n } else { fib(n - 1) + fib(n - 2) }\n}\n\nfn main() {\n    println!("fib(10) = {}", fib(10));\n}\n`,
};
