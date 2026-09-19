import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PRESET_CONTEXT_TAGS, ContextTagSelector } from '../components/checkin/ContextTagSelector';

test('TC-CHIP-01: Preset context tags catalog verification', () => {
  assert.equal(PRESET_CONTEXT_TAGS.length, 6);

  const categories = new Set(PRESET_CONTEXT_TAGS.map((t) => t.category));
  assert.ok(categories.has('biological'));
  assert.ok(categories.has('cognitive'));
  assert.ok(categories.has('milestone'));

  for (const tag of PRESET_CONTEXT_TAGS) {
    assert.ok(tag.id);
    assert.ok(tag.label);
    assert.ok(tag.emoji);
    assert.ok(tag.category);
  }
});

test('TC-CHIP-02: ContextTagSelector component renders chips correctly', () => {
  const jsx = React.createElement(ContextTagSelector, {
    selectedTagIds: ['fatigue', 'milestone_done'],
    onToggleTag: () => {},
    disabled: false,
  });

  const html = renderToStaticMarkup(jsx);
  assert.ok(html.includes('Thiếu ngủ / Mệt mỏi'));
  assert.ok(html.includes('Thể lực sung mãn'));
  assert.ok(html.includes('Vừa hoàn thành mốc quan trọng'));
  assert.ok(html.includes('Đã chọn 2'));
});

test('TC-CHIP-03: ContextTagSelector shows optional state when empty', () => {
  const jsx = React.createElement(ContextTagSelector, {
    selectedTagIds: [],
    onToggleTag: () => {},
    disabled: false,
  });

  const html = renderToStaticMarkup(jsx);
  assert.ok(html.includes('Tùy chọn'));
});
