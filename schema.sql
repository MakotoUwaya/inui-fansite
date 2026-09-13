-- テーブル構造の定義
-- video テーブル
CREATE TABLE IF NOT EXISTS video (
  id UUID PRIMARY KEY,
  video_id VARCHAR(20) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  length INTEGER NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- song テーブル
CREATE TABLE IF NOT EXISTS song (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- singing_stream テーブル
CREATE TABLE IF NOT EXISTS singing_stream (
  id UUID PRIMARY KEY REFERENCES song(id),
  video_id VARCHAR(20) REFERENCES video(video_id),
  start INTEGER NOT NULL,
  end INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_singing_stream_video_id ON singing_stream(video_id);
CREATE INDEX IF NOT EXISTS idx_song_title ON song(title);