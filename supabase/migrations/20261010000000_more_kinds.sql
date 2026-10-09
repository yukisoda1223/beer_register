-- のみくらべ帳: Whisky / Cider / Wine を追加し、表示する種類の設定と、種類ごとの項目を足す
-- Supabase の「SQL Editor」にこのファイルの中身を全部貼り付けて「Run」で1回だけ実行する。

-- ============================================================
-- お酒の種類を追加
-- ============================================================
alter type public.drink_kind add value if not exists 'whisky';
alter type public.drink_kind add value if not exists 'cider';
alter type public.drink_kind add value if not exists 'wine';

-- ============================================================
-- 表示する種類の設定(スマホ・PCで共通)
-- kind_order: 一覧の並び順(上 = ヘッダーの左端)、visible_kinds: ヘッダーに出す種類
-- ============================================================
create table public.user_settings (
  user_id       uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  kind_order    text[] not null default '{beer,sake,whisky,cider,wine}',
  visible_kinds text[] not null default '{beer,sake}',
  updated_at    timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "自分の設定だけ" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- 銘柄(products)の項目
-- ============================================================
drop view public.drink_records;

-- 原料: 日本酒は酒米、ワインはブドウの品種、シードルはリンゴ・洋梨の品種
alter table public.products rename column rice to ingredient;

alter table public.products
  add column age_years integer check (age_years between 0 and 100),          -- Whisky: 熟成年数(空 = NAS)
  add column cask      text,                                                  -- Whisky: 樽
  add column peat      text check (peat in ('none', 'light', 'medium', 'heavy')), -- Whisky: ピート
  add column vintage   integer check (vintage between 1800 and 2200);         -- Wine: ヴィンテージ

-- ============================================================
-- 飲んだ記録(tastings)の項目
-- ============================================================
-- 飲み方(日本酒は温度、ウイスキーは飲み方)。値は英語のキー
alter table public.tastings rename column serving_temp to served;
alter table public.tastings drop constraint if exists drinks_serving_temp_check;
alter table public.tastings drop constraint if exists tastings_serving_temp_check;
alter table public.tastings
  add constraint tastings_served_check
  check (served in ('cold', 'room', 'warm', 'hot', 'neat', 'rocks', 'water', 'highball', 'cocktail'));

alter table public.tastings
  add column aroma_level smallint check (aroma_level between 1 and 5),        -- 日本酒: 香りの強さ 1=控えめ … 5=華やか
  add column body        smallint check (body between 1 and 5),               -- Wine・Whisky: 1=ライト … 5=フル
  add column smoky       numeric(2,1) check (smoky between 0.5 and 5 and smoky * 2 = floor(smoky * 2)); -- Whisky: スモーキーさ ★

-- ============================================================
-- 画面で読むビューを作り直す
-- ============================================================
create view public.drink_records with (security_invoker = true) as
select
  t.id, t.user_id, t.product_id, p.kind, t.status, t.drunk_on,
  p.name, p.name_key, p.maker, p.maker_address, p.region, p.country, p.lat, p.lng,
  p.abv, p.price_yen, p.price_note, p.category, p.beer_family,
  p.polish_ratio, p.sake_meter, p.acidity, p.ingredient,
  p.age_years, p.cask, p.peat, p.vintage,
  t.rating, t.bitterness, t.aroma, t.sweet_dry, t.light_rich, t.aroma_level, t.body, t.smoky, t.served,
  t.comment, t.image_path, p.ai_filled_fields, p.sources,
  t.created_at, t.updated_at
from public.tastings t
join public.products p on p.id = t.product_id;

-- AI の要約(Your Summary)は日本語に変えるので作り直してもらう
delete from public.ai_reports;
