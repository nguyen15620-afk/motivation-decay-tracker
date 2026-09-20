import { NextRequest, NextResponse } from 'next/server';
import { selectOptimalModel, cleanModelName } from '@/lib/interventions/ai/models';

/**
 * Route: POST /api/ai/test-key
 * Description: Validates a user-provided Google Gemini API key by querying
 * Google's ModelService.ListModels endpoint (Zero-Quota consumption).
 * - Fast metadata query (< 0.6s), does not consume generateContent RPD / RPM.
 * - Discovers all supported models for the account.
 * - Picks the optimal model based on cascade priority.
 * - Returns honest, accurate status messages (no false quota alarms).
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body?.apiKey ? String(body.apiKey).trim() : '';

    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json(
        { valid: false, error: 'Vui lòng nhập API Key hợp lệ.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7.0s timeout

    try {
      // Use Google's ListModels metadata discovery API (Zero generation quota spent)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawModels: Array<{ name: string; supportedGenerationMethods?: string[] }> =
          data?.models || [];

        // Filter models that support content generation or have gemini in name
        const supportedModels = rawModels.filter((m) => {
          if (m.supportedGenerationMethods && Array.isArray(m.supportedGenerationMethods)) {
            return m.supportedGenerationMethods.includes('generateContent');
          }
          return m.name && m.name.includes('gemini');
        });

        const availableNames = supportedModels.map((m) => cleanModelName(m.name));
        const optimalModel = selectOptimalModel(availableNames);
        const count = availableNames.length || rawModels.length;

        return NextResponse.json({
          valid: true,
          model: optimalModel,
          availableModelsCount: count,
          message: `Kết nối thành công! Đã nhận diện ${count} models khả dụng (Ưu tiên: ${optimalModel}, Dự phòng: 3.5 Flash Lite 500 RPD).`,
        });
      }

      const errorData = await response.json().catch(() => null);
      const apiMessage = errorData?.error?.message || `HTTP ${response.status}`;

      // Case 1: Bad or revoked key
      if (
        response.status === 400 ||
        apiMessage.includes('API_KEY_INVALID') ||
        apiMessage.toLowerCase().includes('key')
      ) {
        return NextResponse.json(
          {
            valid: false,
            error: 'API Key không hợp lệ hoặc chưa được kích hoạt trên Google AI Studio.',
          },
          { status: 400 }
        );
      }

      // Case 2: Permission denied / IP restriction
      if (response.status === 403) {
        return NextResponse.json(
          {
            valid: false,
            error: 'API Key không có quyền truy cập hoặc bị giới hạn bởi Google (Lỗi 403: Permission Denied).',
          },
          { status: 403 }
        );
      }

      // Case 3: Rate limit on ListModels
      if (response.status === 429) {
        return NextResponse.json(
          {
            valid: false,
            error: 'Tài khoản Google đã đạt giới hạn truy vấn tạm thời (Rate limit 429). Vui lòng thử lại sau giây lát.',
          },
          { status: 429 }
        );
      }

      // Generic Google API error
      return NextResponse.json(
        {
          valid: false,
          error: `Google API trả về lỗi: ${apiMessage}`,
        },
        { status: response.status || 400 }
      );
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          {
            valid: false,
            error: 'Không thể kết nối đến máy chủ Google (quá thời gian chờ 7s). Vui lòng kiểm tra lại kết nối Internet.',
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        {
          valid: false,
          error: `Lỗi kết nối mạng: ${fetchError.message || 'Không thể kết nối tới Google AI Studio'}.`,
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: 'Không thể kiểm tra key lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
