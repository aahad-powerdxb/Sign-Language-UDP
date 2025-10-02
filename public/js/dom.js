// public/js/dom.js
export const ids = {
  btnEn: 'btn-en',
  btnAr: 'btn-ar',
  status: 'status',
  lastReceivedText: 'last-received-text'
};

export function $(id) {
  return document.getElementById(id);
}

export function setStatus(txt) {
  const el = $(ids.status);
  if (el) el.textContent = txt;
}

export function disableButtons(state) {
  const en = $(ids.btnEn);
  const ar = $(ids.btnAr);
  if (en) en.disabled = state;
  if (ar) ar.disabled = state;
}

export function setLastReceived(txt) {
  const el = $(ids.lastReceivedText);
  if (el) el.textContent = txt;
}