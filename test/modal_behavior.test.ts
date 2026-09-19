import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ApiKeySettingsModal } from '../components/settings/ApiKeySettingsModal';

test('TC-MODAL-01: ApiKeySettingsModal returns null when isOpen is false', () => {
  const jsx = React.createElement(ApiKeySettingsModal, {
    isOpen: false,
    onClose: () => {},
  });

  const html = renderToStaticMarkup(jsx);
  assert.equal(html, '', 'Closed modal must render nothing to DOM');
});

test('TC-MODAL-02: ApiKeySettingsModal renders complete UI when isOpen is true', () => {
  const jsx = React.createElement(ApiKeySettingsModal, {
    isOpen: true,
    onClose: () => {},
  });

  const html = renderToStaticMarkup(jsx);

  // Header and Badges
  assert.ok(html.includes('Cài Đặt Gemini API Key'), 'Must contain title');
  assert.ok(html.includes('BYOK'), 'Must contain BYOK badge');

  // Escape routes and actions
  assert.ok(html.includes('Đóng'), 'Must contain Đóng footer button');
  assert.ok(html.includes('Kiểm Tra Kết Nối'), 'Must contain test button');
  assert.ok(html.includes('Lưu Vào Trình Duyệt'), 'Must contain save button');

  // Explanatory copy & Security guarantee
  assert.ok(html.includes('Cơ chế Quota Fallback Tự Động'), 'Must explain automatic cascade fallback');
  assert.ok(html.includes('Bảo mật Zero Server Storage'), 'Must display privacy guarantee');
  assert.ok(html.includes('3.5 Flash Lite'), 'Must mention Flash Lite high-quota tier');
});
