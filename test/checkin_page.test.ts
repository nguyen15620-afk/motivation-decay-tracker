import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StandaloneCheckinPage from '../app/projects/[id]/checkin/page';

test('TC-PAGE-01: StandaloneCheckinPage - Returns Server Component tree with project props', async () => {
  const jsx: any = await StandaloneCheckinPage({
    params: Promise.resolve({ id: 'proj-pyrevit-001' }),
  });

  assert.ok(jsx, 'Page should return valid JSX tree');
  assert.equal(jsx.type, 'div');
  const children = React.Children.toArray(jsx.props.children);
  assert.equal(children.length, 3);

  // Link child points to project detail
  const linkChild: any = children[0];
  assert.equal(linkChild.props.href, '/projects/proj-pyrevit-001');

  // Client child receives resolved project properties
  const clientChild: any = children[2];
  assert.equal(clientChild.props.projectId, 'proj-pyrevit-001');
  assert.equal(clientChild.props.projectName, 'pyRevit MEP Tools');
});

test('TC-PAGE-02: StandaloneCheckinPage - Renders not-found message when project ID is invalid', async () => {
  const jsx = await StandaloneCheckinPage({
    params: Promise.resolve({ id: 'non-existent-project-xyz' }),
  });

  assert.ok(jsx, 'Page should return fallback JSX');
  const html = renderToStaticMarkup(jsx);
  assert.ok(html.includes('Không tìm thấy dự án'), 'Should display not found text');
  assert.ok(html.includes('Quay lại Dashboard'), 'Should include back link');
});
