/*
  script.js — Vanilla JS QR generator with SVG export, PNG download, clipboard copy,
  local vendor library (js/vendor/qrcode.min.js), accessibility, settings persistence,
  and graceful error/loading states.
*/

'use strict';

// Helper to select elements
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// Elements
const textEl = $('#text');
const sizeEl = $('#size');
const marginEl = $('#margin');
const ecEl = $('#ecLevel');
const fgEl = $('#fg');
const bgEl = $('#bg');
const generateBtn = $('#generate');
const exportSvgBtn = $('#exportSvg');
const downloadBtn = $('#download');
const copyBtn = $('#copy');
const canvas = $('#canvas');
const statusEl = $('#status');
const fallback = $('#fallback');
const sizeValue = $('#sizeValue');
const marginValue = $('#marginValue');

// Settings key
const SETTINGS_KEY = 'qrtailor:settings:v1';

// State
let isGenerating = false;

// Utilities
function setStatus(message, isError = false){
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff8b8b' : '';
}

function disableActions(disabled){
  generateBtn.disabled = disabled;
  exportSvgBtn.disabled = disabled;
  downloadBtn.disabled = disabled;
  copyBtn.disabled = disabled;
}

function saveSettings(){
  const s = {
    size: Number(sizeEl.value),
    margin: Number(marginEl.value),
    ec: ecEl.value,
    fg: fgEl.value,
    bg: bgEl.value,
    last: textEl.value
  };
  try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }catch(e){ /* ignore */ }
}

function loadSettings(){
  try{
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if(!s) return;
    sizeEl.value = s.size || 512;
    marginEl.value = s.margin || 4;
    ecEl.value = s.ec || 'M';
    fgEl.value = s.fg || '#ffffff';
    bgEl.value = s.bg || '#000000';
    textEl.value = s.last || '';
  }catch(e){/* ignore */}
}

// Debounce
function debounce(fn, wait = 300){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// Initialize outputs next to ranges
function updateRangeOutputs(){
  sizeValue.textContent = sizeEl.value;
  marginValue.textContent = marginEl.value;
}

// Core generate function
async function generate(){
  const value = textEl.value.trim();
  if(!value){
    setStatus('Please enter text or a URL to generate a QR code.', true);
    clearCanvas();
    disableActions(true);
    return;
  }

  setStatus('Generating...');
  disableActions(true);
  isGenerating = true;
  saveSettings();

  const opts = {
    errorCorrectionLevel: ecEl.value,
    margin: Number(marginEl.value),
    width: Number(sizeEl.value),
    color: { dark: fgEl.value, light: bgEl.value }
  };

  try{
    // Ensure canvas is the right pixel size
    canvas.width = opts.width;
    canvas.height = opts.width;

    // Fill background
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.color.light;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Use vendored lib (qrcode.min.js) which exposes QRCode
    if(window.QRCode && typeof window.QRCode.toCanvas === 'function'){
      await window.QRCode.toCanvas(canvas, value, opts);
      fallback.classList.add('hidden');
      setStatus('Done');
      disableActions(false);
    }else{
      // If library isn't available, show error
      throw new Error('QR library not available');
    }
  }catch(e){
    console.error(e);
    // Show fallback message and keep canvas cleared
    setStatus('Failed to generate with local library. See console for details.', true);
    clearCanvas();
    disableActions(true);
  }finally{
    isGenerating = false;
  }
}

function clearCanvas(){
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  fallback.classList.remove('hidden');
}

// Export SVG — prefer library's svg output if available, otherwise embed PNG in SVG wrapper
async function exportSVG(){
  const value = textEl.value.trim();
  if(!value){ setStatus('Enter text to export SVG.', true); return; }
  setStatus('Preparing SVG...');

  try{
    if(window.QRCode && typeof window.QRCode.toString === 'function'){
      // library supports toString with type svg
      const opts = { errorCorrectionLevel: ecEl.value, margin: Number(marginEl.value), type: 'svg', color: { dark: fgEl.value, light: bgEl.value } };
      // toString may be callback-based or promise-based depending on build — normalize
      const svgString = await new Promise((resolve, reject) => {
        try{
          window.QRCode.toString(value, opts, (err, str) => err ? reject(err) : resolve(str));
        }catch(err){ reject(err); }
      });
      downloadBlob(new Blob([svgString], { type: 'image/svg+xml' }), 'qr.svg');
      setStatus('SVG exported');
      return;
    }

    // Fallback: generate PNG from canvas and embed in SVG wrapper
    await generate();
    const dataUrl = canvas.toDataURL('image/png');
    const s = Number(sizeEl.value);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">\n  <image href="${dataUrl}" width="${s}" height="${s}"/>\n</svg>`;
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'qr.svg');
    setStatus('SVG exported (fallback)');
  }catch(e){
    console.error(e);
    setStatus('SVG export failed.', true);
  }
}

// Download PNG
function downloadPNG(){
  try{
    const filename = 'qr.png';
    // Use toBlob for better performance
    canvas.toBlob((blob) => {
      if(!blob){ setStatus('PNG export failed.', true); return; }
      downloadBlob(blob, filename);
      setStatus('PNG downloaded');
    }, 'image/png');
  }catch(e){
    console.error(e);
    setStatus('Download failed.', true);
  }
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Copy PNG to clipboard ( modern browsers )
async function copyPNG(){
  try{
    if(!navigator.clipboard || !window.ClipboardItem){
      throw new Error('Clipboard API not available');
    }
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if(!blob) throw new Error('Failed to create image blob');
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    setStatus('PNG copied to clipboard');
  }catch(e){
    console.error(e);
    setStatus('Copy to clipboard failed — try downloading instead.', true);
  }
}

// Event wiring
generateBtn.addEventListener('click', generate);
exportSvgBtn.addEventListener('click', exportSVG);
downloadBtn.addEventListener('click', downloadPNG);
copyBtn.addEventListener('click', copyPNG);

// Keyboard accessibility: Ctrl/Cmd + Enter to generate
textEl.addEventListener('keydown', (e) => {
  if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
    e.preventDefault();
    generate();
  }
});

// Live update on input with debounce
const debouncedGenerate = debounce(() => {
  saveSettings();
  // do not auto-generate on every keystroke to avoid perf issues, but allow size/color changes
  updateRangeOutputs();
}, 300);

[textEl, sizeEl, marginEl, ecEl, fgEl, bgEl].forEach(el => el.addEventListener('input', debouncedGenerate));

sizeEl.addEventListener('input', updateRangeOutputs);
marginEl.addEventListener('input', updateRangeOutputs);

// On load: restore settings
(function init(){
  loadSettings();
  updateRangeOutputs();
  clearCanvas();
  setStatus('Ready');
  disableActions(true);
  // If there is existing content, render once
  if(textEl.value.trim()){
    generate();
  }
})();

// Expose some internals for debugging (dev builds only)
// window._qr = { generate };
