import { createPool } from '@vercel/postgres';

// Vercel Postgres クライアントを作成
export const db = createPool({
  connectionString: process.env.POSTGRES_URL,
});

// 接続テスト用関数
export async function testConnection() {
  try {
    const { rows } = await db.query('SELECT NOW()');
    return { success: true, timestamp: rows[0].now };
  } catch (error) {
    console.error('データベース接続エラー:', error);
    return { success: false, error };
  }
}