import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/supabase/queries';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('[API /api/projects GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, status } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const project = await createProject({
      name: name.trim(),
      description: description?.trim() || '',
      status: status === 'archived' || status === 'completed' ? status : 'active',
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('[API /api/projects POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
