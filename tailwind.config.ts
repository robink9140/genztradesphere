import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#171717', accent: '#d4ff3f' }, fontFamily: { sans: ['Arial', 'Helvetica', 'sans-serif'] } } }, plugins: [] } satisfies Config;
