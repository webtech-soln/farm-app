/**
 * `server-only` exists to make a build fail when server code is imported into
 * a client bundle. There is no client bundle in a test run, so it stands in as
 * an empty module rather than being resolved by Next's bundler.
 */
export {};
