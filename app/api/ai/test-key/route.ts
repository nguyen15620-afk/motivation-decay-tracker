import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_MODEL_CASCADE, isRetryableModelError } from '@/lib/interventions/ai/models';

/**
 * Route: POST /api/ai/test-key
 * Description: Validates a user-provided Google Gemini API key by probing
 * the Gemini Model Cascade chain (Gemini 3.8 -> 3.5 Lite -> 2.5 Flash...).
 * Automatically cascades over 404 (model not found) or 429 (quota exceeded).
 * Returns the active model name upon successful connection.
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

    let lastErrorMessage = '';
    const deadline = Date.now() + 4500; // 4.5s total test probe budget

    for (const model of GEMINI_MODEL_CASCADE) {
      const remainingTime = deadline - Date.now();
      if (remainingTime < 500) {
        break;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(2500, remainingTime));

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
              generationConfig: { maxOutputTokens: 1 },
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          return NextResponse.json({
            valid: true,
            model,
            message: `Kết nối Google Gemini thành công! Đã kích hoạt model: ${model}`,
          });
        }

        const errorData = await response.json().catch(() => null);
        const apiMessage = errorData?.error?.message || `HTTP ${response.status}`;
        lastErrorMessage = apiMessage;

        // If the key itself is completely invalid (API_KEY_INVALID), no point trying other models
        if (apiMessage.includes('API_KEY_INVALID') || (response.status === 400 && apiMessage.toLowerCase().includes('key'))) {
          return NextResponse.json(
            {
              valid: false,
              error: `API Key không hợp lệ hoặc đã bị vô hiệu hóa bởi Google.`,
            },
            { status: 400 }
          );
        }

        // Check if retryable (404 Not Found, 429 Quota Exceeded, etc.)
        if (isRetryableModelError(response.status, apiMessage)) {
          // Cascade to the next model
          continue;
        }

        // If it's another non-retryable error, continue attempting backup models
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          continue;
        }
        lastErrorMessage = fetchError.message || 'Lỗi mạng khi gọi Google API';
      }
    }

    return NextResponse.json(
      {
        valid: false,
        error: `Không thể kết nối tới Google Gemini. Lỗi: ${lastErrorMessage || 'Hết hạn mức hoặc không tìm thấy model tương thích'}`,
      },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: 'Không thể kiểm tra key lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
