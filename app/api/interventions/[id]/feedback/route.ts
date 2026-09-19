/**
 * API Route: /api/interventions/[id]/feedback
 * Method: PATCH / POST
 * Description: Logs user sentiment feedback ('helpful', 'not_helpful', 'dismissed')
 * on smart coaching suggestions to refine future recommendation quality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateInterventionResponse } from '@/lib/supabase/queries';
import { UserResponse } from '@/lib/supabase/types';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { response } = body;

    const validResponses: UserResponse[] = ['helpful', 'not_helpful', 'dismissed'];
    if (!validResponses.includes(response)) {
      return NextResponse.json(
        { error: 'Giá trị response không hợp lệ (phải là helpful, not_helpful, hoặc dismissed)' },
        { status: 400 }
      );
    }

    const success = await updateInterventionResponse(id, response);
    if (!success) {
      return NextResponse.json(
        { error: 'Không tìm thấy can thiệp hoặc không thể cập nhật' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      interventionId: id,
      userResponse: response,
    });
  } catch (error: any) {
    console.error('[API /api/interventions/[id]/feedback] Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật phản hồi can thiệp', details: error?.message },
      { status: 500 }
    );
  }
}
