-- のみくらべノート: 初回の使い方紹介を見たかどうかを覚えておく
-- Supabase の「SQL Editor」にこのファイルの中身を全部貼り付けて「Run」で1回だけ実行する。
alter table public.user_settings add column if not exists onboarded_at timestamptz;
