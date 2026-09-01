const $ = (id) => document.getElementById(id);
const checkButton = $('check');
const status = $('status');
const results = $('results');

const connectionPanel = document.querySelector('.spec-card');
if (connectionPanel) {
  connectionPanel.remove();
  document.querySelector('.hero-grid').style.gridTemplateColumns = '1fr';
}

const fetchJSON = async (url, timeout = 7000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
};

const getAddress = async (version) => {
  const host = version === 4 ? 'api4.ipify.org' : 'api6.ipify.org';
  const data = await fetchJSON(`https://${host}?format=json`);
  if (!data.ip) throw new Error('IP not returned');
  return data.ip;
};

const setProtocol = (version, value, available) => {
  $(`ipv${version}`).textContent = available ? value : 'Unavailable';
  $(`ipv${version}-state`).textContent = available ? 'available' : `IPv${version} not detected`;
  document.querySelector(`[data-copy="ipv${version}"]`).hidden = !available;
};

const countryFlag = (code = '') => code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()));

async function checkIP() {
  checkButton.disabled = true;
  checkButton.textContent = 'Checking…';
  status.textContent = 'Detecting available protocols…';
  results.hidden = false;
  setProtocol(4, '', false); setProtocol(6, '', false);
  $('ipv4').textContent = $('ipv6').textContent = 'Checking…';

  const [v4, v6] = await Promise.allSettled([getAddress(4), getAddress(6)]);
  const ipv4 = v4.status === 'fulfilled' ? v4.value : null;
  const ipv6 = v6.status === 'fulfilled' ? v6.value : null;
  setProtocol(4, ipv4, Boolean(ipv4));
  setProtocol(6, ipv6, Boolean(ipv6));
  const primary = ipv4 || ipv6;

  if (!primary) {
    $('primary-ip').textContent = 'Could not detect';
    status.textContent = 'The check services are unavailable. Please try again.';
    checkButton.disabled = false; checkButton.textContent = 'Try again';
    return;
  }

  $('primary-ip').textContent = primary;
  status.textContent = 'Finding your approximate location…';
  try {
    const geo = await fetchJSON(`https://ipwho.is/${encodeURIComponent(primary)}`);
    if (geo.success === false) throw new Error(geo.message || 'Lookup failed');
    $('location').textContent = [geo.city, geo.country].filter(Boolean).join(', ') || 'Unknown';
    $('country').textContent = geo.country || '—';
    $('region').textContent = geo.region || '—';
    $('city').textContent = geo.city || '—';
    $('isp').textContent = geo.connection?.isp || '—';
    $('asn').textContent = geo.connection?.asn ? `AS${geo.connection.asn}` : '—';
    $('timezone').textContent = geo.timezone?.id || '—';
    $('flag').textContent = countryFlag(geo.country_code);
    status.textContent = 'Check complete.';
  } catch { status.textContent = 'IP detected; location data is currently unavailable.'; }
  checkButton.disabled = false; checkButton.textContent = 'Check again';
}

checkButton.addEventListener('click', checkIP);
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const value = $(button.dataset.copy).textContent;
  try { await navigator.clipboard.writeText(value); button.textContent = 'copied'; }
  catch { button.textContent = 'failed'; }
  setTimeout(() => { button.textContent = 'copy'; }, 1500);
}));

const meta = document.querySelector('meta[name="theme-color"]');
const initialTheme = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const applyTheme = theme => {
  document.documentElement.dataset.theme = theme;
  meta.content = theme === 'dark' ? '#0d1117' : '#f5f4ef';
};
applyTheme(initialTheme);
$('theme').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next); localStorage.setItem('theme', next);
});
