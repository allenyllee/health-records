import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAppOrigin } from '../.sites-runtime/site-config.mjs';
import { createWidgetHtml, widgetHtml } from '../.sites-runtime/widget.mjs';

test('public origin is disabled until explicitly configured', () => {
  for (const value of [undefined, null, '', {}, 'not-a-url']) assert.equal(publicAppOrigin(value), '');
  assert.match(widgetHtml, /const siteUrl="";/);
  assert.match(widgetHtml, /disabled=!siteUrl/);
});

test('public origin accepts HTTPS and explicit loopback development origins', () => {
  assert.equal(publicAppOrigin(' https://health.example.org/ '), 'https://health.example.org');
  assert.equal(publicAppOrigin('http://localhost:5173'), 'http://localhost:5173');
  assert.equal(publicAppOrigin('http://127.0.0.1:5173'), 'http://127.0.0.1:5173');
  assert.equal(publicAppOrigin('http://[::1]:5173'), 'http://[::1]:5173');
  assert.match(createWidgetHtml('https://health.example.org'), /const siteUrl="https:\/\/health\.example\.org";/);
});

test('public origin rejects credentials, remote HTTP, paths, and script injection', () => {
  for (const value of ['javascript:alert(1)', 'http://example.org', 'https://user:password@example.org', 'https://example.org/path', 'https://example.org/?x=1', 'https://example.org/#fragment', 'https://example.org/</script>']) {
    assert.equal(publicAppOrigin(value), '');
    assert.match(createWidgetHtml(value), /const siteUrl="";/);
  }
});
