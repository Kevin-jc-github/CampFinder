const test = require('node:test');
const assert = require('node:assert/strict');
const { inferOperationalStatus } = require('../services/operationalStatus');

test('detects temporarily closed listings', () => {
  assert.equal(inferOperationalStatus('春趣汇乐园(暂停营业)'), 'temporarily_closed');
});
test('detects permanently closed listings', () => {
  assert.equal(inferOperationalStatus('营地已关闭'), 'closed');
});
test('leaves unlabelled listings unknown', () => {
  assert.equal(inferOperationalStatus('山谷露营地'), 'unknown');
});
