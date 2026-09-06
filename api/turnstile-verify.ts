// Node serverless function.
//
// One-line re-export of the shared Turnstile verify endpoint. This is the
// ONLY writer of the `aireon_ts_clear` clearance cookie.
// See aireon-shared/docs/TURNSTILE_STANDARD.md.
export { config, default } from '@aireon/shared/turnstile-verify';
