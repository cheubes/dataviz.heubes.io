// Checks every dataset source URL declared in the visualizations' frontmatter.
// See "Surveillance des sources" in specs/technical-specifications.md.
// Exits with code 1 only when a link is broken: blocked or unverifiable links
// are reported but never fail the run, since anti-bot walls and incomplete
// certificate chains are not dead sources.
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';

const CONTENT_DIR = 'src/content/visualizations';
const TIMEOUT_MS = 60_000;
const RETRY_DELAY_MS = 5_000;
const CONCURRENCY = 6;
const USER_AGENT = 'Mozilla/5.0 (compatible; dataviz.heubes.io source link check)';

function collectUrls() {
  const urls = new Map();
  for (const file of readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.md'))) {
    const slug = file.replace(/\.(fr|en)\.md$/, '');
    const frontmatter = readFileSync(`${CONTENT_DIR}/${file}`, 'utf8').split(/^---$/m)[1] ?? '';
    for (const match of frontmatter.matchAll(/^\s+url:\s*['"]?([^'"\s]+)['"]?\s*$/gm)) {
      const slugs = urls.get(match[1]) ?? new Set();
      slugs.add(slug);
      urls.set(match[1], slugs);
    }
  }
  return urls;
}

// 'broken' fails the run; 'unverified' covers answers that say nothing about
// whether the source still exists (anti-bot 403, rate limiting, TLS quirks).
function classify(outcome) {
  if (outcome.status !== undefined) {
    if (outcome.status < 400) return 'ok';
    if (outcome.status === 404 || outcome.status === 410 || outcome.status >= 500) return 'broken';
    return 'unverified';
  }
  if (outcome.code === 'ENOTFOUND' || outcome.code === 'ECONNREFUSED') return 'broken';
  return 'unverified';
}

async function request(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,*/*' },
    });
    await response.body?.cancel();
    return { status: response.status };
  } catch (error) {
    const code = error.name === 'TimeoutError' ? 'TIMEOUT' : (error.cause?.code ?? error.name);
    return { code };
  }
}

async function check(url) {
  let outcome = await request(url);
  // One retry for transient failures, so a slow or briefly failing server is
  // not reported as a dead source.
  if (outcome.code === 'TIMEOUT' || outcome.code === 'ECONNRESET' || outcome.status >= 500) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    outcome = await request(url);
  }
  return { url, detail: outcome.status ?? outcome.code, verdict: classify(outcome) };
}

async function checkAll(urls) {
  const queue = [...urls];
  const results = [];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) results.push(await check(queue.shift()));
    })
  );
  return results;
}

const urls = collectUrls();
const results = await checkAll(urls.keys());
const byVerdict = (verdict) => results.filter((result) => result.verdict === verdict);
const line = ({ url, detail }) => `- ${[...urls.get(url)].join(', ')}: ${url} (${detail})`;

const broken = byVerdict('broken');
const unverified = byVerdict('unverified');
const report = [
  `## Source links: ${results.length} checked, ${broken.length} broken, ${unverified.length} unverified`,
  '',
  ...(broken.length ? ['### Broken', ...broken.map(line), ''] : []),
  ...(unverified.length ? ['### Unverified (blocked, rate-limited or TLS issue, check by hand if it persists)', ...unverified.map(line), ''] : []),
].join('\n');

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
process.exitCode = broken.length > 0 ? 1 : 0;
