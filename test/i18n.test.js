const test = require('node:test');
const assert = require('node:assert/strict');
const { createI18n } = require('../config/i18n');

test('English translations and value labels are available', () => {
  const { lang, t, tv } = createI18n('en');
  assert.equal(lang, 'en');
  assert.equal(t('site.title'), 'Camping Recommend System · Discover Campsites in China');
  assert.equal(t('nav.explore'), 'Explore');
  assert.equal(tv('森林营地'), 'Forest');
  assert.equal(t('card.capacity', { count: 8 }), 'Up to 8 guests');
});

test('unsupported language falls back to Chinese', () => {
  const { lang, t } = createI18n('fr');
  assert.equal(lang, 'zh');
  assert.equal(t('nav.explore'), '找营地');
});
