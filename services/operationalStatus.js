function inferOperationalStatus(text = '') {
  const value = String(text);
  if (/永久关闭|已关闭|停止营业|closed permanently|permanently closed/i.test(value)) return 'closed';
  if (/暂停营业|临时关闭|暂不开放|temporarily closed/i.test(value)) return 'temporarily_closed';
  if (/正常营业|营业中|open now/i.test(value)) return 'open';
  return 'unknown';
}

module.exports = { inferOperationalStatus };
