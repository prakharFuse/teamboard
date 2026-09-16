/**
 * Levelled console logger.
 *
 * FIXTURE NOTE: the `tiers.medium` fixture issue asks an agent to add a
 * `--quiet` flag that suppresses info-level output. That ticket is answerable
 * only because this module has a level concept and `src/index.js` has an arg
 * parser — keep both.
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

// Hardcoded default. One of the values the config-centralisation fixture is
// expected to find.
let currentLevel = 'info';

export function setLevel(level) {
  if (!(level in LEVELS)) throw new Error(`Unknown log level: ${level}`);
  currentLevel = level;
}

function emit(level, message, meta) {
  if (LEVELS[level] < LEVELS[currentLevel]) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  const stream = LEVELS[level] >= LEVELS.warn ? process.stderr : process.stdout;
  stream.write(meta === undefined ? `${line}\n` : `${line} ${JSON.stringify(meta)}\n`);
}

export const logger = {
  debug: (m, meta) => emit('debug', m, meta),
  info: (m, meta) => emit('info', m, meta),
  warn: (m, meta) => emit('warn', m, meta),
  error: (m, meta) => emit('error', m, meta),
};
