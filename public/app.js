const $ = (id) => document.getElementById(id);
const checkButton = $('check');
const status = $('status');
const results = $('results');

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

const setStatus = (message, error = false) => {
  status.innerHTML = '';
  const mark = document.createElement('span');
  mark.className = 'status-mark';
  mark.textContent = error ? '×' : '●';
  if (error) mark.style.color = 'var(--danger)';
  status.append(mark, document.createTextNode(` ${message}`));
};

const setProtocol = (version, value, available) => {
  $(`ipv${version}`).textContent = available ? value : 'Unavailable';
  $(`ipv${version}-state`).textContent = available ? 'AVAILABLE' : `IPv${version} NOT DETECTED`;
  $(`ipv${version}-light`).classList.toggle('off', !available);
  document.querySelector(`[data-copy="ipv${version}"]`).hidden = !available;
};

const countryFlag = (code = '') => code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()));

async function checkIP() {
  checkButton.disabled = true;
  checkButton.innerHTML = '<span class="prompt">$</span> CHECKING…';
  setStatus('Detecting available protocols…');
  results.hidden = false;
  setProtocol(4, '', false); setProtocol(6, '', false);
  $('ipv4').textContent = $('ipv6').textContent = 'Checking…';
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const [v4, v6] = await Promise.allSettled([getAddress(4), getAddress(6)]);
  const ipv4 = v4.status === 'fulfilled' ? v4.value : null;
  const ipv6 = v6.status === 'fulfilled' ? v6.value : null;
  setProtocol(4, ipv4, Boolean(ipv4));
  setProtocol(6, ipv6, Boolean(ipv6));
  const primary = ipv4 || ipv6;

  if (!primary) {
    $('primary-ip').textContent = 'Could not detect';
    setStatus('The check services are unavailable. Please try again.', true);
    checkButton.disabled = false;
    checkButton.innerHTML = '<span class="prompt">$</span> TRY AGAIN <span class="arrow">→</span>';
    return;
  }

  $('primary-ip').textContent = primary;
  setStatus('Finding your approximate location…');
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
    setStatus('Connection report complete.');
  } catch {
    setStatus('IP detected; location data is currently unavailable.', true);
  }
  checkButton.disabled = false;
  checkButton.innerHTML = '<span class="prompt">$</span> CHECK AGAIN <span class="arrow">→</span>';
}

checkButton.addEventListener('click', checkIP);
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const value = $(button.dataset.copy).textContent;
  try { await navigator.clipboard.writeText(value); button.textContent = 'COPIED'; }
  catch { button.textContent = 'FAILED'; }
  setTimeout(() => { button.textContent = 'COPY'; }, 1500);
}));

const themeMeta = document.querySelector('meta[name="theme-color"]');
const preferred = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  $('theme').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  themeMeta.content = theme === 'dark' ? '#0d1117' : '#f5f4ef';
};
applyTheme(preferred);
$('theme').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next); localStorage.setItem('theme', next);
});
$('year').textContent = new Date().getFullYear();
