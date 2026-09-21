import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as handleCheckin } from '../app/api/checkins/route';
import { POST as handleFeedback } from '../app/api/interventions/[id]/feedback/route';
import { GET as handleTrend } from '../app/api/trend/[projectId]/route';
import { GET as handleCron } from '../app/api/cron/analyze-trends/route';
import { POST as handleCreateProject } from '../app/api/projects/route';
import { GET as handleProjectDetail, DELETE as handleDeleteProject } from '../app/api/projects/[id]/route';

test('TC-API-01: POST /api/checkins - Rejects missing project_id with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/checkins', {
    method: 'POST',
    body: JSON.stringify({ score: 7 }),
  });
  const res = await handleCheckin(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('project_id'));
});

test('TC-API-02: POST /api/checkins - Rejects invalid score (< 1, > 10, non-numeric) with 400', async () => {
  // Score = 0
  const req1 = new NextRequest('http://localhost:3000/api/checkins', {
    method: 'POST',
    body: JSON.stringify({ project_id: 'proj-pyrevit-001', score: 0 }),
  });
  const res1 = await handleCheckin(req1);
  assert.equal(res1.status, 400);

  // Score = 11
  const req2 = new NextRequest('http://localhost:3000/api/checkins', {
    method: 'POST',
    body: JSON.stringify({ project_id: 'proj-pyrevit-001', score: 11 }),
  });
  const res2 = await handleCheckin(req2);
  assert.equal(res2.status, 400);

  // Score = "not-a-number"
  const req3 = new NextRequest('http://localhost:3000/api/checkins', {
    method: 'POST',
    body: JSON.stringify({ project_id: 'proj-pyrevit-001', score: 'abc' }),
  });
  const res3 = await handleCheckin(req3);
  assert.equal(res3.status, 400);
});

test('TC-API-03: POST /api/checkins - Rejects invalid energy (< 1, > 10) with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/checkins', {
    method: 'POST',
    body: JSON.stringify({ project_id: 'proj-pyrevit-001', score: 7, energy: 12 }),
  });
  const res = await handleCheckin(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('energy') || data.error.includes('năng lượng'));
});

test('TC-API-04: POST /api/checkins - Returns 404 for non-existent project', async () => {
  const req = new NextRequest('http://localhost:3000/api/checkins', {
    method: 'POST',
    body: JSON.stringify({ project_id: 'non-existent-proj-999', score: 6 }),
  });
  const res = await handleCheckin(req);
  assert.equal(res.status, 404);
});

test('TC-API-05: POST /api/checkins - Successfully records checkin, updates trend, and returns 200', async () => {
  const req = new NextRequest('http://localhost:3000/api/checkins', {
    method: 'POST',
    body: JSON.stringify({
      project_id: 'proj-pyrevit-001',
      score: 3,
      energy: 3,
      context_note: 'Bế tắc nhiều việc quá deadline dí',
    }),
  });
  const res = await handleCheckin(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.checkin);
  assert.equal(data.checkin.score, 3);
  assert.ok(data.trendAnalysis);
});

test('TC-API-06: POST /api/interventions/[id]/feedback - Validates response values', async () => {
  // Invalid sentiment
  const reqBad = new NextRequest('http://localhost:3000/api/interventions/mock-int-001/feedback', {
    method: 'POST',
    body: JSON.stringify({ response: 'invalid_sentiment' }),
  });
  const resBad = await handleFeedback(reqBad, { params: Promise.resolve({ id: 'mock-int-001' }) });
  assert.equal(resBad.status, 400);

  // Non-existent intervention ID
  const reqNotFound = new NextRequest('http://localhost:3000/api/interventions/random-id/feedback', {
    method: 'POST',
    body: JSON.stringify({ response: 'helpful' }),
  });
  const resNotFound = await handleFeedback(reqNotFound, { params: Promise.resolve({ id: 'random-id' }) });
  assert.equal(resNotFound.status, 404);

  // Valid feedback
  const reqGood = new NextRequest('http://localhost:3000/api/interventions/mock-int-001/feedback', {
    method: 'POST',
    body: JSON.stringify({ response: 'helpful' }),
  });
  const resGood = await handleFeedback(reqGood, { params: Promise.resolve({ id: 'mock-int-001' }) });
  assert.equal(resGood.status, 200);
  const dataGood = await resGood.json();
  assert.equal(dataGood.success, true);
  assert.equal(dataGood.userResponse, 'helpful');
});

test('TC-API-07: GET /api/trend/[projectId] - 404 for unknown project, 200 for valid project', async () => {
  // Unknown project
  const req404 = new NextRequest('http://localhost:3000/api/trend/unknown-id');
  const res404 = await handleTrend(req404, { params: Promise.resolve({ projectId: 'unknown-id' }) });
  assert.equal(res404.status, 404);

  // Valid project
  const req200 = new NextRequest('http://localhost:3000/api/trend/proj-pyrevit-001');
  const res200 = await handleTrend(req200, { params: Promise.resolve({ projectId: 'proj-pyrevit-001' }) });
  assert.equal(res200.status, 200);
  const data200 = await res200.json();
  assert.equal(data200.success, true);
  assert.ok(data200.project);
  assert.ok(data200.trendAnalysis);
  assert.ok(Array.isArray(data200.interventions));
});

test('TC-API-08: GET /api/cron/analyze-trends - Runs background scan and generates summary report', async () => {
  const req = new NextRequest('http://localhost:3000/api/cron/analyze-trends');
  const res = await handleCron(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.totalActiveProjects >= 4);
  assert.ok(Array.isArray(data.summary));
});

test('TC-API-09: GET & DELETE /api/projects/[id] - Lifecycle tests', async () => {
  // 1. Create a project first via API
  const createReq = new NextRequest('http://localhost:3000/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Project to be Deleted Via API',
      description: 'Test API endpoint delete',
    }),
  });
  const createRes = await handleCreateProject(createReq);
  assert.equal(createRes.status, 201);
  const createdData = await createRes.json();
  const projectId = createdData.project.id;
  assert.ok(projectId);

  // 2. GET /api/projects/[id] returns 200
  const getReq = new NextRequest(`http://localhost:3000/api/projects/${projectId}`);
  const getRes = await handleProjectDetail(getReq, { params: Promise.resolve({ id: projectId }) });
  assert.equal(getRes.status, 200);
  const getData = await getRes.json();
  assert.equal(getData.project.name, 'Project to be Deleted Via API');

  // 3. DELETE /api/projects/[id] returns 200
  const deleteReq = new NextRequest(`http://localhost:3000/api/projects/${projectId}`, {
    method: 'DELETE',
  });
  const deleteRes = await handleDeleteProject(deleteReq, { params: Promise.resolve({ id: projectId }) });
  assert.equal(deleteRes.status, 200);
  const deleteData = await deleteRes.json();
  assert.equal(deleteData.success, true);

  // 4. Subsequent GET returns 404
  const getAfterDeleteRes = await handleProjectDetail(getReq, { params: Promise.resolve({ id: projectId }) });
  assert.equal(getAfterDeleteRes.status, 404);

  // 5. Subsequent DELETE returns 404
  const deleteAgainRes = await handleDeleteProject(deleteReq, { params: Promise.resolve({ id: projectId }) });
  assert.equal(deleteAgainRes.status, 404);
});
