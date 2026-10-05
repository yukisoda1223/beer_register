-- のみくらべ帳: 最初のテーブル作成(仕様書 §5)
-- Supabase の「SQL Editor」にこのファイルの中身を全部貼り付けて「Run」で実行する。

-- ============================================================
-- 種類
-- ============================================================
create type public.drink_kind as enum ('beer', 'sake');
create type public.drink_status as enum ('draft', 'saved');

-- updated_at を自動で更新するための関数
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- drinks: 記録1件 = 1行
-- ============================================================
create table public.drinks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind            public.drink_kind not null,
  status          public.drink_status not null default 'draft',

  -- 共通
  drunk_on        date not null default current_date,   -- 飲んだ日
  name            text not null,                         -- 商品名(正式名称)
  maker           text,                                  -- 醸造所 / 酒蔵
  maker_address   text,                                  -- 醸造所・酒蔵の所在地(文字)
  country         text,                                  -- 国(日本酒は基本「日本」)
  prefecture      text,                                  -- 都道府県(日本の場合)
  lat             double precision,                      -- 地図のピン用
  lng             double precision,
  abv             numeric(4,1),                          -- 度数 %
  price_yen       integer,                               -- 値段(参考価格)
  price_note      text,                                  -- 例: 「350ml缶」「720ml」
  rating          numeric(2,1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  aroma           numeric(2,1) check (aroma between 0.5 and 5 and aroma * 2 = floor(aroma * 2)),
  comment         text,                                  -- フリーコメント
  image_path      text,                                  -- Storage のパス
  category        text,                                  -- ビール: スタイル / 日本酒: 特定名称

  -- ビールのみ
  beer_family     text check (beer_family in ('ale', 'lager', 'other')),
  bitterness      numeric(2,1) check (bitterness between 0.5 and 5 and bitterness * 2 = floor(bitterness * 2)),

  -- 日本酒のみ
  polish_ratio    integer,                               -- 精米歩合 %
  sake_meter      numeric(4,1),                          -- 日本酒度
  acidity         numeric(3,1),                          -- 酸度
  rice            text,                                  -- 酒米
  sweet_dry       smallint check (sweet_dry between 1 and 5),     -- 1=甘口 … 5=辛口
  light_rich      smallint check (light_rich between 1 and 5),    -- 1=淡麗 … 5=濃醇
  serving_temp    text check (serving_temp in ('cold', 'room', 'warm', 'hot')),

  -- AI関連
  ai_filled_fields text[] not null default '{}',         -- AIが埋めた項目名
  sources         jsonb not null default '[]',           -- [{title, url}] AIが参照したページ

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- 保存(本保存)するときは必須項目がそろっていること。下書きは name だけでよい
  constraint drinks_saved_required check (
    status = 'draft' or (rating is not null and category is not null)
  )
);

create index drinks_user_kind_status_idx on public.drinks (user_id, kind, status, drunk_on desc);

create trigger drinks_set_updated_at
  before update on public.drinks
  for each row execute function public.set_updated_at();

-- ============================================================
-- research_cache: AIの調査結果の使い回し
-- ============================================================
create table public.research_cache (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        public.drink_kind not null,
  query_key   text not null,          -- 正規化した銘柄名
  result      jsonb not null,
  created_at  timestamptz not null default now(),
  unique (user_id, kind, query_key)
);

-- ============================================================
-- ai_reports: レポートのAIコメント(Your Summary)
-- ============================================================
create table public.ai_reports (
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind          public.drink_kind not null,
  comment       text not null,
  record_count  integer not null,     -- 作ったときの保存済み件数
  created_at    timestamptz not null default now(),
  primary key (user_id, kind)
);

-- ============================================================
-- ai_usage: AIの呼び出し回数の記録
-- ============================================================
create table public.ai_usage (
  id         bigserial primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  purpose    text not null check (purpose in ('research', 'report', 'quick_input')),
  created_at timestamptz not null default now()
);

create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at desc);

-- ============================================================
-- geocode_cache: 住所 → 緯度経度 の使い回し(個人の情報ではないので共有)
-- ============================================================
create table public.geocode_cache (
  address    text primary key,
  lat        double precision,
  lng        double precision,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS: 自分の行だけ読み書きできる
-- ============================================================
alter table public.drinks         enable row level security;
alter table public.research_cache enable row level security;
alter table public.ai_reports     enable row level security;
alter table public.ai_usage       enable row level security;
alter table public.geocode_cache  enable row level security;

create policy "自分の記録だけ" on public.drinks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "自分の調査結果だけ" on public.research_cache
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "自分のレポートだけ" on public.ai_reports
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 利用回数は読むのと追加だけ(消したり書き換えたりはできない)
create policy "自分の利用回数を読む" on public.ai_usage
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "自分の利用回数を追加" on public.ai_usage
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "ログイン中なら読める" on public.geocode_cache
  for select to authenticated
  using (true);

create policy "ログイン中なら追加できる" on public.geocode_cache
  for insert to authenticated
  with check (true);

-- ============================================================
-- Storage: 写真の置き場所(非公開)。パスは {user_id}/{drink_id}.webp
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('drink-images', 'drink-images', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "自分の写真を見る" on storage.objects
  for select to authenticated
  using (bucket_id = 'drink-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "自分の写真を追加" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'drink-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "自分の写真を差し替え" on storage.objects
  for update to authenticated
  using (bucket_id = 'drink-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "自分の写真を削除" on storage.objects
  for delete to authenticated
  using (bucket_id = 'drink-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
