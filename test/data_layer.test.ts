import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProjects,
  getProjectById,
  createProject,
  deleteProject,
  getCheckins,
  createCheckin,
  getTrendFlags,
  createTrendFlag,
  getInterventions,
  createIntervention,
  updateInterventionResponse,
} from '../lib/supabase/queries';

test('TC-DB-01: getProjects - Returns seed projects', async () => {
  const projects = await getProjects();
  assert.ok(Array.isArray(projects));
  assert.ok(projects.length >= 4);
  const pyRevit = projects.find((p) => p.name === 'pyRevit MEP Tools');
  assert.ok(pyRevit);
  assert.equal(pyRevit?.status, 'active');
});

test('TC-DB-02: getProjectById - Retrieves existing project and returns null for invalid id', async () => {
  const proj = await getProjectById('proj-pyrevit-001');
  assert.ok(proj);
  assert.equal(proj?.id, 'proj-pyrevit-001');
  assert.equal(proj?.name, 'pyRevit MEP Tools');

  const nonExistent = await getProjectById('non-existent-uuid-999');
  assert.equal(nonExistent, null);
});

test('TC-DB-03: createProject - Inserts new project and verifies retrieval', async () => {
  const newProj = await createProject({
    name: 'Automation Test Project',
    description: 'Project created during automated test execution',
    status: 'active',
  });

  assert.ok(newProj.id);
  assert.equal(newProj.name, 'Automation Test Project');

  const retrieved = await getProjectById(newProj.id);
  assert.ok(retrieved);
  assert.equal(retrieved?.name, 'Automation Test Project');
});

test('TC-DB-04: getCheckins & createCheckin - Filters by project and persists new records', async () => {
  const pyRevitCheckins = await getCheckins('proj-pyrevit-001');
  assert.ok(pyRevitCheckins.length > 0);
  assert.ok(pyRevitCheckins.every((c) => c.project_id === 'proj-pyrevit-001'));

  const newCheckin = await createCheckin({
    project_id: 'proj-pyrevit-001',
    score: 8,
    energy: 7,
    context_note: 'Automated test checkin',
  });

  assert.ok(newCheckin.id);
  assert.equal(newCheckin.score, 8);
  assert.equal(newCheckin.energy, 7);
  assert.equal(newCheckin.context_note, 'Automated test checkin');

  const updatedCheckins = await getCheckins('proj-pyrevit-001');
  assert.ok(updatedCheckins.some((c) => c.id === newCheckin.id));
});

test('TC-DB-05: TrendFlags & Interventions - Creation and retrieval', async () => {
  const flag = await createTrendFlag({
    project_id: 'proj-pyrevit-001',
    window_start: '2026-09-01',
    window_end: '2026-09-20',
    slope: -0.19,
    flag_type: 'declining',
    confidence: 0.88,
  });
  assert.ok(flag.id);

  const flags = await getTrendFlags('proj-pyrevit-001');
  assert.ok(flags.some((f) => f.id === flag.id));

  const intervention = await createIntervention({
    project_id: 'proj-pyrevit-001',
    trend_flag_id: flag.id,
    suggestion_type: 'break_task',
    message: 'Test intervention message',
    user_response: null,
  });
  assert.ok(intervention.id);
  assert.equal(intervention.user_response, null);

  // Update response to 'helpful'
  const updateSuccess = await updateInterventionResponse(intervention.id, 'helpful');
  assert.equal(updateSuccess, true);

  const updatedList = await getInterventions('proj-pyrevit-001');
  const found = updatedList.find((i) => i.id === intervention.id);
  assert.equal(found?.user_response, 'helpful');

  // Updating non-existent intervention should return false
  const notFound = await updateInterventionResponse('invalid-id-xyz', 'helpful');
  assert.equal(notFound, false);
});

test('TC-DB-06: deleteProject - deletes project and cascades', async () => {
  // Create a temporary project to delete
  const newProj = await createProject({
    name: 'Temporary Project For Deletion',
    description: 'Will be deleted in TC-DB-06',
    status: 'active',
  });
  assert.ok(newProj.id);

  // Add a checkin to verify cascade
  const checkin = await createCheckin({
    project_id: newProj.id,
    motivation_level: 4,
    mood: 'focused',
    task_description: 'Temporary task',
    blockers: '',
    ai_feedback: 'Keep going!',
  });
  assert.ok(checkin.id);

  // Verify project exists
  const retrieved = await getProjectById(newProj.id);
  assert.ok(retrieved);
  assert.equal(retrieved?.name, 'Temporary Project For Deletion');

  // Delete the project
  const deleted = await deleteProject(newProj.id);
  assert.equal(deleted, true);

  // Verify project no longer exists
  const afterDelete = await getProjectById(newProj.id);
  assert.equal(afterDelete, null);

  // Deleting non-existent project returns false
  const deleteNonExistent = await deleteProject('non-existent-id-999');
  assert.equal(deleteNonExistent, false);
});
