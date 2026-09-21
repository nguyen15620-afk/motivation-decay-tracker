/**
 * API Route: /api/projects/[id]
 * Methods: GET, DELETE
 * Description: Manages individual project entity, including retrieving details
 * and deleting a project along with its cascade dependencies (checkins, flags, interventions).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, deleteProject } from '@/lib/supabase/queries';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu project id trong đường dẫn' },
        { status: 400 }
      );
    }

    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Không tìm thấy dự án' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi truy xuất dự án' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu project id trong đường dẫn' },
        { status: 400 }
      );
    }

    const existing = await getProjectById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy dự án để xóa' },
        { status: 404 }
      );
    }

    const success = await deleteProject(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Không thể xóa dự án từ cơ sở dữ liệu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa dự án "${existing.name}" thành công.`,
      deletedId: id,
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi xóa dự án' },
      { status: 500 }
    );
  }
}
