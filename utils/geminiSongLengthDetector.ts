/**
 * Gemini API を活用した歌枠動画の歌唱区間（開始・終了時間）高精度自動検出ユーティリティ
 */

export type SongDetectInput = {
  videoId: string;
  title: string;
  artist?: string;
  initialStart: number;
  initialEnd?: number | null;
};

export type SongDetectResult = {
  start: number;
  end: number;
  confidence: number;
  reason: string;
  method: 'gemini' | 'itunes_fallback' | 'heuristic';
};

/**
 * 秒数を MM:SS または HH:MM:SS にフォーマット
 */
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * iTunes Search API を利用して公式音源の長さを取得（フォールバック用）
 */
export async function fetchTrackDuration(title: string, artist: string = ''): Promise<number | null> {
  const cleanTitle = title
    .replace(/[\(（].*?[\)）]/g, '')
    .replace(/[【\[].*?[】\]]/g, '')
    .trim();
  const cleanArtist = artist
    .replace(/[\(（].*?[\)）]/g, '')
    .replace(/[【\[].*?[】\]]/g, '')
    .trim();

  try {
    const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`.trim());
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&country=JP&entity=song&limit=3`);
    if (res.ok) {
      const data: any = await res.json();
      if (data.results && data.results.length > 0) {
        return Math.round(data.results[0].trackTimeMillis / 1000);
      }
    }
  } catch {}

  try {
    const query = encodeURIComponent(cleanTitle);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&country=JP&entity=song&limit=3`);
    if (res.ok) {
      const data: any = await res.json();
      if (data.results && data.results.length > 0) {
        return Math.round(data.results[0].trackTimeMillis / 1000);
      }
    }
  } catch {}

  return null;
}

/**
 * Gemini API による歌唱区間自動判定
 */
export async function detectSongBoundariesWithGemini(
  input: SongDetectInput
): Promise<SongDetectResult> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  const currentDuration =
    input.initialEnd !== null && input.initialEnd !== undefined
      ? input.initialEnd - input.initialStart
      : 300;

  // APIキーがない場合は iTunes フォールバック
  if (!apiKey) {
    return fallbackToItunes(input, 'Gemini API キー (GEMINI_API_KEY) が未設定です');
  }

  const videoUrl = `https://www.youtube.com/watch?v=${input.videoId}`;
  const startStr = formatTime(input.initialStart);
  const endStr = input.initialEnd ? formatTime(input.initialEnd) : '未定';

  const prompt = `あなたはVTuberの歌枠アーカイブから正確な楽曲クリップ区間（開始・終了時間）を特定するAIアシスタントです。
対象動画: ${videoUrl}
楽曲: 「${input.title}」（アーティスト: ${input.artist || '不明'}）
有志タイムスタンプ目安: ${startStr} (${input.initialStart}秒) 〜 ${endStr} (${input.initialEnd ?? '未定'}秒)

【検出タスク】
動画の該当区間を視聴・解析し、以下の2つの時刻（秒単位）を正確に特定してください：

1. start_seconds (歌唱開始時刻):
   - 伴奏（イントロ）または歌い出しが実際に始まる時刻。
   - 曲前のMC、雑談、曲紹介、準備時間は除外してください。

2. end_seconds (歌唱終了時刻):
   - 歌唱が終わり、アウトロ（後奏）の伴奏の余韻が収まる時刻。
   - 歌い終わった直後のMCや雑談（「ふぅ〜」「ありがとうございました」「はい、ということで」など）は含めないでください。

【注意点】
- もし有志タイムスタンプが既に歌い出しに合っている場合はその付近を採用してください。
- 終了時刻が次の曲直前まで伸びていて雑談が含まれている場合は、歌唱終了直後でカットしてください。
- ワンコーラスやメドレーの場合は、実際の歌唱終了位置で終了してください。`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              fileData: {
                fileUri: videoUrl,
                mimeType: 'video/*',
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            start_seconds: { type: 'INTEGER' },
            end_seconds: { type: 'INTEGER' },
            confidence: { type: 'NUMBER' },
            reason: { type: 'STRING' },
          },
          required: ['start_seconds', 'end_seconds', 'reason'],
        },
        temperature: 0.1,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`⚠️ Gemini API 呼び出し失敗 (${response.status}): ${errText}`);
      return fallbackToItunes(input, `Gemini API エラー: HTTP ${response.status}`);
    }

    const resJson: any = await response.json();
    const candidate = resJson.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      return fallbackToItunes(input, 'Gemini API から応答テキストを取得できませんでした');
    }

    const parsed = JSON.parse(text);
    const start = Math.max(0, Number(parsed.start_seconds) || input.initialStart);
    let end = Number(parsed.end_seconds);

    // バリデーション
    if (!end || end <= start) {
      end = start + (input.initialEnd ? input.initialEnd - input.initialStart : 240);
    }

    return {
      start,
      end,
      confidence: Number(parsed.confidence) || 0.9,
      reason: parsed.reason || 'Gemini マルチモーダル解析による自動検出',
      method: 'gemini',
    };
  } catch (err: any) {
    console.warn(`⚠️ Gemini 解析例外: ${err.message}`);
    return fallbackToItunes(input, `Gemini 解析例外: ${err.message}`);
  }
}

/**
 * iTunes 公式音源情報によるフォールバック補正
 */
async function fallbackToItunes(input: SongDetectInput, reasonPrefix: string): Promise<SongDetectResult> {
  const officialDuration = await fetchTrackDuration(input.title, input.artist);
  const currentDuration = input.initialEnd ? input.initialEnd - input.initialStart : null;

  if (officialDuration) {
    // 公式曲長 + 余韻15秒
    const suggestedDuration = officialDuration + 15;

    // 現在の尺が著しく長い（+30秒以上）場合はカット、そうでなければ現在尺または提案尺を採用
    let finalEnd = input.initialEnd;
    if (!finalEnd || (currentDuration && currentDuration > suggestedDuration + 30)) {
      finalEnd = input.initialStart + suggestedDuration;
    }

    return {
      start: input.initialStart,
      end: finalEnd,
      confidence: 0.7,
      reason: `${reasonPrefix} -> iTunes公式曲長(${formatTime(officialDuration)}) + 余韻15s を適用`,
      method: 'itunes_fallback',
    };
  }

  // 公式音源も見つからない場合：5分（300秒）以上の極長曲なら標準4分15秒（255秒）に補正
  let finalEnd = input.initialEnd || input.initialStart + 255;
  if (currentDuration && currentDuration >= 420) {
    finalEnd = input.initialStart + 255;
  }

  return {
    start: input.initialStart,
    end: finalEnd,
    confidence: 0.4,
    reason: `${reasonPrefix} -> 公式曲長不明のためヒューリスティック補正を適用`,
    method: 'heuristic',
  };
}
