let qrInstance = null;
let lastTableNumber = '';
let bulkItems = [];
let isBulkGenerating = false;

const PREVIEW_QR_SIZE_PX = 800;
const BULK_PREVIEW_QR_SIZE_PX = 600;
const DOWNLOAD_QR_SIZE_PX = 1000;
const QR_ECC_LEVEL = 'H';
const QR_LOGO_SIZE_RATIO = 0.23;

function $(id) {
  return document.getElementById(id);
}

// Centralized SweetAlert helpers to avoid repeated config blocks.
function swalError(title, text) {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'OK'
  });
}

function swalSuccess(title, text) {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#10b981',
    confirmButtonText: 'OK'
  });
}

function getDefaultMenuUrlValue() {
  try {
    const url = new URL('../../index.html', window.location.href);
    return url.toString();
  } catch (_) {
    return '';
  }
}

function getLogoDataUrlFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

// Converts any image (URL or data URL) into a circular PNG data URL for sharp center logos.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

async function makeCircularLogoDataUrl(src, sizePx) {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;

  const scale = Math.max(sizePx / img.width, sizePx / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (sizePx - drawW) / 2;
  const dy = (sizePx - drawH) / 2;

  ctx.clearRect(0, 0, sizePx, sizePx);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sizePx / 2, sizePx / 2, sizePx / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

function normalizeFinalUrl(menuUrlRaw, tableNumberRaw) {
  const menuUrl = String(menuUrlRaw || '').trim();
  const tableNumber = String(tableNumberRaw || '').trim();
  const u = (() => {
    try {
      return new URL(menuUrl);
    } catch (_) {
      return new URL(menuUrl, window.location.origin);
    }
  })();
  u.searchParams.set('table', tableNumber);
  return u.toString();
}

function validateForm() {
  const menuUrl = $('menuUrl').value.trim();
  const tableNumber = $('tableNumber').value.trim();

  if (!menuUrl) {
    swalError('Validation Error', 'Please enter Menu URL');
    return null;
  }

  try {
    normalizeFinalUrl(menuUrl, '1');
  } catch (_) {
    swalError('Invalid URL', 'Please enter a valid URL (example: https://domain.com/menu)');
    return null;
  }

  if (!tableNumber) {
    swalError('Validation Error', 'Please enter Table Number');
    return null;
  }

  return { menuUrl, tableNumber };
}

function validateBulkForm() {
  const menuUrl = $('menuUrl').value.trim();
  const tableCountRaw = String($('tableCount').value || '').trim();
  const count = parseInt(tableCountRaw, 10);

  if (!menuUrl) {
    swalError('Validation Error', 'Please enter Menu URL');
    return null;
  }

  try {
    normalizeFinalUrl(menuUrl, '1');
  } catch (_) {
    swalError('Invalid URL', 'Please enter a valid URL (example: https://domain.com/menu)');
    return null;
  }

  if (!Number.isFinite(count) || count <= 0) {
    swalError('Invalid Table Count', 'Please enter a valid number of tables (example: 10).');
    return null;
  }

  if (count > 300) {
    swalError('Too Many Tables', 'Please enter 300 or fewer tables for bulk generation.');
    return null;
  }

  return { menuUrl, count };
}

function animateButton(btn, scale) {
  if (!btn || typeof anime === 'undefined') return;
  anime.remove(btn);
  anime({
    targets: btn,
    scale,
    duration: 180,
    easing: 'easeOutQuad'
  });
}

function animateQrAppear(mount) {
  if (!mount || typeof anime === 'undefined') return;
  anime.remove(mount);
  anime({
    targets: mount,
    opacity: [0, 1],
    scale: [0.96, 1],
    duration: 420,
    easing: 'easeOutExpo'
  });
}

function animateDownloadSuccess(mount) {
  if (!mount || typeof anime === 'undefined') return;
  anime.remove(mount);
  anime({
    targets: mount,
    scale: [1, 1.03, 1],
    duration: 380,
    easing: 'easeInOutQuad'
  });
}

function setBulkLoading(loading, message) {
  isBulkGenerating = Boolean(loading);
  const spinner = $('bulkSpinner');
  const status = $('bulkStatus');
  const generateAllBtn = $('generateAllBtn');
  const downloadZipBtn = $('downloadZipBtn');
  const generateBtn = $('generateBtn');
  const downloadBtn = $('downloadBtn');
  const resetBtn = $('resetBtn');

  if (spinner) spinner.classList.toggle('hidden', !loading);
  if (status) status.textContent = message || '';

  const disableAll = Boolean(loading);
  if (generateAllBtn) generateAllBtn.disabled = disableAll;
  if (downloadZipBtn) downloadZipBtn.disabled = disableAll || bulkItems.length === 0;
  if (generateBtn) generateBtn.disabled = disableAll;
  if (downloadBtn) downloadBtn.disabled = disableAll || !qrInstance;
  if (resetBtn) resetBtn.disabled = disableAll;
}

function renderBulkEmptyState() {
  const grid = $('bulkGrid');
  const empty = $('bulkEmptyState');
  const zipBtn = $('downloadZipBtn');

  if (!grid || !empty) return;

  const has = bulkItems.length > 0;
  grid.classList.toggle('hidden', !has);
  empty.classList.toggle('hidden', has);
  if (zipBtn) zipBtn.disabled = !has || isBulkGenerating;
}

function createBulkCard(tableNumber, finalUrl) {
  const card = document.createElement('div');
  card.className = 'qrgen-card';

  const header = document.createElement('div');
  header.className = 'qrgen-card-header';

  const title = document.createElement('div');
  title.className = 'qrgen-card-title';
  title.textContent = `Table ${tableNumber}`;

  header.appendChild(title);
  card.appendChild(header);

  const url = document.createElement('div');
  url.className = 'qrgen-card-url';
  url.textContent = finalUrl;
  card.appendChild(url);

  const mount = document.createElement('div');
  mount.className = 'qrgen-card-mount';
  mount.id = `bulkQrMount_${tableNumber}_${Math.random().toString(16).slice(2)}`;
  card.appendChild(mount);

  const actions = document.createElement('div');
  actions.className = 'qrgen-card-actions';

  const download = document.createElement('button');
  download.type = 'button';
  download.className = 'bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95';
  download.textContent = 'Download';
  download.setAttribute('data-table', String(tableNumber));
  download.setAttribute('data-bulk-download', '1');

  actions.appendChild(download);
  card.appendChild(actions);

  return { card, mount, download };
}

function getLogoSourceUrlOrDataUrl() {
  const logoFile = ($('logoFile').files && $('logoFile').files[0]) ? $('logoFile').files[0] : null;
  const defaultLogoUrl = new URL('../../images/logo.png', window.location.href).toString();
  return { logoFile, defaultLogoUrl };
}

function createQrInstance(finalUrl, logo, sizePx) {
  return new QRCodeStyling({
    width: sizePx,
    height: sizePx,
    type: 'canvas',
    data: finalUrl,
    margin: 10,
    image: logo,
    qrOptions: { errorCorrectionLevel: QR_ECC_LEVEL },
    dotsOptions: { color: '#000000', type: 'rounded' },
    cornersSquareOptions: { color: '#000000', type: 'extra-rounded' },
    cornersDotOptions: { color: '#000000', type: 'dot' },
    backgroundOptions: { color: '#ffffff' },
    imageOptions: { crossOrigin: 'anonymous', margin: 10, imageSize: QR_LOGO_SIZE_RATIO }
  });
}

async function generateQR() {
  const values = validateForm();
  if (!values) return;

  const { menuUrl, tableNumber } = values;
  const { logoFile, defaultLogoUrl } = getLogoSourceUrlOrDataUrl();
  const qrMount = $('qrMount');
  const previewHint = $('previewHint');
  const downloadBtn = $('downloadBtn');

  let finalUrl = '';
  try {
    finalUrl = normalizeFinalUrl(menuUrl, tableNumber);
  } catch (_) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid URL',
      text: 'Could not build the final URL. Please check the Menu URL input.',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'OK'
    });
    return;
  }

  let logo = defaultLogoUrl;
  try {
    const uploaded = await getLogoDataUrlFromFile(logoFile);
    if (uploaded) logo = uploaded;
  } catch (_) {
    swalError('Logo Error', 'Could not read the uploaded logo. Please try a different image.');
    return;
  }

  try {
    logo = await makeCircularLogoDataUrl(logo, 600);
  } catch (_) {}

  if (qrInstance && typeof qrInstance.update === 'function') {
    try {
      qrInstance.update({
        data: finalUrl,
        image: logo
      });
    } catch (_) {
      qrInstance = null;
    }
  }

  if (!qrInstance) qrInstance = createQrInstance(finalUrl, logo, PREVIEW_QR_SIZE_PX);

  if (qrMount) {
    qrMount.innerHTML = '';
    qrInstance.append(qrMount);
    qrMount.style.opacity = '1';
    animateQrAppear(qrMount);
  }

  if (previewHint) previewHint.style.display = 'none';
  if (downloadBtn) downloadBtn.disabled = false;

  $('finalUrlLabel').textContent = finalUrl;
  lastTableNumber = tableNumber;

  swalSuccess('QR Generated Successfully', 'Your table QR code is ready.');
}

async function generateAllTables() {
  if (isBulkGenerating) return;

  const values = validateBulkForm();
  if (!values) return;
  const { menuUrl, count } = values;

  const { logoFile, defaultLogoUrl } = getLogoSourceUrlOrDataUrl();
  let logo = defaultLogoUrl;
  try {
    const uploaded = await getLogoDataUrlFromFile(logoFile);
    if (uploaded) logo = uploaded;
  } catch (_) {
    swalError('Logo Error', 'Could not read the uploaded logo. Please try a different image.');
    return;
  }

  try {
    logo = await makeCircularLogoDataUrl(logo, 512);
  } catch (_) {}

  const grid = $('bulkGrid');
  if (!grid) return;

  bulkItems = [];
  grid.innerHTML = '';
  renderBulkEmptyState();

  $('bulkFinalUrlBase').textContent = menuUrl;

  setBulkLoading(true, `Generating 0 / ${count}`);

  for (let i = 1; i <= count; i++) {
    const tableNumber = String(i);
    let finalUrl = '';
    try {
      finalUrl = normalizeFinalUrl(menuUrl, tableNumber);
    } catch (_) {
      setBulkLoading(false, '');
      swalError('Invalid URL', 'Could not build the final URL. Please check the Menu URL input.');
      return;
    }

    const { card, mount } = createBulkCard(tableNumber, finalUrl);
    grid.appendChild(card);
    renderBulkEmptyState();

    const qr = createQrInstance(finalUrl, logo, BULK_PREVIEW_QR_SIZE_PX);
    qr.append(mount);

    bulkItems.push({ tableNumber, finalUrl, logo });

    setBulkLoading(true, `Generating ${i} / ${count}`);
    await new Promise((r) => setTimeout(r, 0));
    animateQrAppear(mount);
  }

  setBulkLoading(false, `Generated ${count} table QR codes`);

  swalSuccess('QR Generated Successfully', `Generated ${count} table QR codes.`);
}

async function downloadBulkItem(tableNumber) {
  const t = String(tableNumber || '').trim();
  if (!t) return;
  const item = bulkItems.find(x => String(x.tableNumber) === t);
  if (!item) return;

  const qr = createQrInstance(item.finalUrl, item.logo, DOWNLOAD_QR_SIZE_PX);

  try {
    await qr.download({ name: `table-${t}-qr`, extension: 'png' });
  } catch (_) {
    swalError('Download Failed', 'Could not download the QR image. Please try again.');
    return;
  }

  swalSuccess('Downloaded', `Saved as table-${t}-qr.png`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadAllAsZip() {
  if (isBulkGenerating) return;

  if (!bulkItems.length) {
    swalError('No QRs Found', 'Please generate table QRs before downloading ZIP.');
    return;
  }

  if (typeof JSZip === 'undefined') {
    swalError('ZIP Library Missing', 'JSZip could not be loaded. Please refresh and try again.');
    return;
  }

  const result = await Swal.fire({
    icon: 'question',
    title: 'Download All as ZIP?',
    text: `Package ${bulkItems.length} QR codes into one ZIP file?`,
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Download ZIP',
    cancelButtonText: 'Cancel'
  });
  if (!result.isConfirmed) return;

  // ZIP is created client-side (static hosting friendly). Each QR is exported as high-res PNG.
  setBulkLoading(true, `Preparing ZIP 0 / ${bulkItems.length}`);

  const zip = new JSZip();
  for (let i = 0; i < bulkItems.length; i++) {
    const item = bulkItems[i];
    const t = String(item.tableNumber);
    const qr = createQrInstance(item.finalUrl, item.logo, DOWNLOAD_QR_SIZE_PX);

    let blob = null;
    try {
      blob = await qr.getRawData('png');
    } catch (_) {
      setBulkLoading(false, '');
      swalError('ZIP Failed', 'Could not prepare QR images for ZIP. Please try again.');
      return;
    }

    zip.file(`table-${t}-qr.png`, blob);
    setBulkLoading(true, `Preparing ZIP ${i + 1} / ${bulkItems.length}`);
    await new Promise((r) => setTimeout(r, 0));
  }

  let zipBlob = null;
  try {
    zipBlob = await zip.generateAsync({ type: 'blob' });
  } catch (_) {
    setBulkLoading(false, '');
    swalError('ZIP Failed', 'Could not generate ZIP file. Please try again.');
    return;
  }

  const filename = `table-qrs-${bulkItems.length}.zip`;
  downloadBlob(zipBlob, filename);
  animateDownloadSuccess($('bulkGrid'));
  setBulkLoading(false, `Downloaded ${filename}`);

  swalSuccess('Downloaded', `Saved as ${filename}`);
}

async function downloadQR() {
  if (!qrInstance) {
    swalError('No QR Found', 'Please generate a QR code before downloading.');
    return;
  }

  const tableNumber = String(lastTableNumber || $('tableNumber').value || '').trim();
  if (!tableNumber) {
    swalError('Missing Table Number', 'Please enter Table Number');
    return;
  }

  const result = await Swal.fire({
    icon: 'question',
    title: 'Download QR?',
    text: `Download PNG for table ${tableNumber}?`,
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Download',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    const menuUrl = $('menuUrl').value.trim();
    const finalUrl = normalizeFinalUrl(menuUrl, tableNumber);
    const { logoFile, defaultLogoUrl } = getLogoSourceUrlOrDataUrl();
    let logo = defaultLogoUrl;
    const uploaded = await getLogoDataUrlFromFile(logoFile);
    if (uploaded) logo = uploaded;
    try {
      logo = await makeCircularLogoDataUrl(logo, 900);
    } catch (_) {}

    const highRes = createQrInstance(finalUrl, logo, DOWNLOAD_QR_SIZE_PX);
    await highRes.download({ name: `table-${tableNumber}-qr`, extension: 'png' });
  } catch (_) {
    swalError('Download Failed', 'Could not download the QR image. Please try again.');
    return;
  }

  animateDownloadSuccess($('qrMount'));

  swalSuccess('Downloaded', `Saved as table-${tableNumber}-qr.png`);
}

function resetForm() {
  $('menuUrl').value = getDefaultMenuUrlValue();
  $('tableNumber').value = '';
  $('tableCount').value = '';
  $('logoFile').value = '';
  $('finalUrlLabel').textContent = '';
  $('qrMount').innerHTML = '';
  $('previewHint').style.display = '';
  $('downloadBtn').disabled = true;
  $('bulkFinalUrlBase').textContent = '';
  $('bulkGrid').innerHTML = '';
  bulkItems = [];
  renderBulkEmptyState();
  $('bulkStatus').textContent = '';
  $('bulkSpinner').classList.add('hidden');
  $('downloadZipBtn').disabled = true;
  qrInstance = null;
  lastTableNumber = '';
}

function setupButtonAnimations() {
  const buttons = [$('generateBtn'), $('downloadBtn'), $('resetBtn'), $('generateAllBtn'), $('downloadZipBtn')].filter(Boolean);
  buttons.forEach((btn) => {
    btn.addEventListener('mouseenter', () => animateButton(btn, 1.03));
    btn.addEventListener('mouseleave', () => animateButton(btn, 1));
    btn.addEventListener('focus', () => animateButton(btn, 1.02));
    btn.addEventListener('blur', () => animateButton(btn, 1));
  });
}

document.addEventListener('DOMContentLoaded', function () {
  $('menuUrl').value = getDefaultMenuUrlValue();
  setupButtonAnimations();
  renderBulkEmptyState();

  $('generateBtn').addEventListener('click', generateQR);
  $('downloadBtn').addEventListener('click', downloadQR);
  $('resetBtn').addEventListener('click', resetForm);
  $('generateAllBtn').addEventListener('click', generateAllTables);
  $('downloadZipBtn').addEventListener('click', downloadAllAsZip);

  $('bulkGrid').addEventListener('click', function (e) {
    const t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute('data-bulk-download') !== '1') return;
    const table = t.getAttribute('data-table');
    downloadBulkItem(table);
  });
});
