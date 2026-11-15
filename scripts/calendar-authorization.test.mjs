import assert from 'node:assert/strict';
import test from 'node:test';
import { openCalendarAuthorization } from '../src/utils/openCalendarAuthorization.ts';

function browserFixture() {
  const events = [];
  const tab = {
    opener: {}, closed: false,
    location: { replace: (url) => events.push(['navigate', url]) },
    close: () => { tab.closed = true; events.push(['close']); },
  };
  return { events, tab, browser: { open: (...args) => { events.push(['open', ...args]); return tab; } } };
}

test('reserves the sign-in tab before waiting for the authorization API', async () => {
  const { events, tab, browser } = browserFixture();
  let resolveUrl;
  const pendingUrl = new Promise((resolve) => { resolveUrl = resolve; });
  const result = openCalendarAuthorization(() => pendingUrl, () => assert.fail('native opener used on web'), browser);
  assert.deepEqual(events, [['open', 'about:blank', '_blank']]);
  assert.equal(tab.opener, null);
  resolveUrl('https://accounts.google.com/test');
  await result;
  assert.deepEqual(events[1], ['navigate', 'https://accounts.google.com/test']);
});

test('a blocked popup reports an actionable error without starting OAuth', async () => {
  await assert.rejects(openCalendarAuthorization(
    () => assert.fail('OAuth must not start when the popup is blocked'),
    () => assert.fail('native opener used on web'),
    { open: () => null },
  ), /Allow pop-ups/);
});

test('API failure closes the placeholder tab and preserves the error', async () => {
  const { tab, browser } = browserFixture();
  const failure = new Error('API unavailable');
  await assert.rejects(openCalendarAuthorization(async () => { throw failure; }, () => assert.fail(), browser), failure);
  assert.equal(tab.closed, true);
});

test('an existing connection closes the placeholder without starting sign-in', async () => {
  const { tab, events, browser } = browserFixture();
  await openCalendarAuthorization(async () => null, () => assert.fail(), browser);
  assert.equal(tab.closed, true);
  assert.equal(events.some(([type]) => type === 'navigate'), false);
});

test('a tab closed while the API is loading reports a retry message', async () => {
  const { tab, browser } = browserFixture();
  await assert.rejects(openCalendarAuthorization(async () => {
    tab.closed = true;
    return 'https://accounts.google.com/test';
  }, () => assert.fail(), browser), /tab was closed/);
});

test('native connections open the authorization URL in the external browser', async () => {
  const urls = [];
  await openCalendarAuthorization(async () => 'https://accounts.google.com/test', async (url) => { urls.push(url); });
  assert.deepEqual(urls, ['https://accounts.google.com/test']);
});
