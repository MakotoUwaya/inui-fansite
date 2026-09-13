// Vercel Postgres 接続をテストするためのスクリプト
import { db, testConnection } from '../utils/postgresClient';

async function main() {
  try {
    // 接続テスト
    const result = await testConnection();
    console.log('接続テスト結果:', result);

    // テーブル一覧を取得
    const { rows: tables } = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('テーブル一覧:', tables.map(t => t.table_name));

    console.log('接続テスト完了!');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main();