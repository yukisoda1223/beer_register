-- のみくらべ帳: 銘柄(products)と飲んだ記録(tastings)を分ける + データを英語にそろえる
-- Supabase の「SQL Editor」にこのファイルの中身を全部貼り付けて「Run」で1回だけ実行する。
-- 今までの drinks テーブルは消さずに drinks_old という名前で残す(問題がなければ後で消してよい)。

-- ============================================================
-- products: 銘柄1つ = 1行(醸造所・スタイル・度数など、何回飲んでも変わらない情報)
-- ============================================================
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind             public.drink_kind not null,
  name             text not null,
  name_key         text not null,                       -- 正規化した商品名(同じ銘柄の判定に使う)
  maker            text,
  maker_address    text,
  region           text,                                -- 産地の地域。日本は都道府県(例: Nagano)、海外は州・都市(例: Ontario)
  country          text,                                -- 英語の国名(例: Japan, Canada)
  lat              double precision,
  lng              double precision,
  abv              numeric(4,1),
  price_yen        integer,
  price_note       text,
  category         text,
  beer_family      text check (beer_family in ('ale', 'lager', 'other')),
  polish_ratio     integer,
  sake_meter       numeric(4,1),
  acidity          numeric(3,1),
  rice             text,
  ai_filled_fields text[] not null default '{}',
  sources          jsonb not null default '[]',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, kind, name_key)
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- tastings: 飲んだ1回 = 1行(日付・評価・写真・コメント)
-- ============================================================
create table public.tastings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  status       public.drink_status not null default 'draft',
  drunk_on     date not null default current_date,
  rating       numeric(2,1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  bitterness   numeric(2,1) check (bitterness between 0.5 and 5 and bitterness * 2 = floor(bitterness * 2)),
  aroma        numeric(2,1) check (aroma between 0.5 and 5 and aroma * 2 = floor(aroma * 2)),
  sweet_dry    smallint check (sweet_dry between 1 and 5),
  light_rich   smallint check (light_rich between 1 and 5),
  serving_temp text check (serving_temp in ('cold', 'room', 'warm', 'hot')),
  comment      text,
  image_path   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint tastings_saved_required check (status = 'draft' or rating is not null)
);

create index tastings_user_status_idx on public.tastings (user_id, status, drunk_on desc);
create index tastings_product_idx on public.tastings (product_id);

create trigger tastings_set_updated_at
  before update on public.tastings
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: 自分の行だけ
-- ============================================================
alter table public.products enable row level security;
alter table public.tastings enable row level security;

create policy "自分の銘柄だけ" on public.products
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "自分の記録だけ" on public.tastings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ============================================================
-- 画面で読むためのビュー(飲んだ記録 + 銘柄の情報)。security_invoker で RLS がそのまま効く
-- ============================================================
create view public.drink_records with (security_invoker = true) as
select
  t.id, t.user_id, t.product_id, p.kind, t.status, t.drunk_on,
  p.name, p.name_key, p.maker, p.maker_address, p.region, p.country, p.lat, p.lng,
  p.abv, p.price_yen, p.price_note, p.category, p.beer_family,
  p.polish_ratio, p.sake_meter, p.acidity, p.rice,
  t.rating, t.bitterness, t.aroma, t.sweet_dry, t.light_rich, t.serving_temp,
  t.comment, t.image_path, p.ai_filled_fields, p.sources,
  t.created_at, t.updated_at
from public.tastings t
join public.products p on p.id = t.product_id;

-- ============================================================
-- 今までの記録(drinks)を移す。日本語のカテゴリ・国名・都道府県は英語にする
-- ============================================================
create temporary table category_map (ja text primary key, en text not null, family text);
insert into category_map values
  ('ピルスナー', 'Pilsner', 'lager'), ('ラガー(その他)', 'Lager', 'lager'), ('ヘレス', 'Helles', 'lager'),
  ('ボック', 'Bock', 'lager'), ('ラオホ', 'Rauchbier', 'lager'), ('ペールエール', 'Pale Ale', 'ale'),
  ('IPA', 'IPA', 'ale'), ('セッションIPA', 'Session IPA', 'ale'), ('ヘイジーIPA', 'Hazy IPA', 'ale'),
  ('ダブルIPA', 'Double IPA', 'ale'), ('ヴァイツェン', 'Weizen', 'ale'), ('ベルジャンホワイト', 'Witbier', 'ale'),
  ('セゾン', 'Saison', 'ale'), ('アンバーエール', 'Amber Ale', 'ale'), ('ブラウンエール', 'Brown Ale', 'ale'),
  ('ポーター', 'Porter', 'ale'), ('スタウト', 'Stout', 'ale'), ('ケルシュ', 'Kölsch', 'ale'),
  ('トリペル', 'Tripel', 'ale'), ('バーレイワイン', 'Barleywine', 'ale'), ('サワーエール', 'Sour Ale', 'other'),
  ('フルーツビール', 'Fruit Beer', 'other'), ('その他', 'Other', 'other'),
  ('純米大吟醸', 'Junmai Daiginjo', null), ('純米吟醸', 'Junmai Ginjo', null), ('特別純米', 'Tokubetsu Junmai', null),
  ('純米', 'Junmai', null), ('大吟醸', 'Daiginjo', null), ('吟醸', 'Ginjo', null),
  ('特別本醸造', 'Tokubetsu Honjozo', null), ('本醸造', 'Honjozo', null), ('普通酒', 'Futsushu', null);

-- スプレッドシートから取り込んだ記録の「元の種類」で、新しく増えたスタイルに直す
create temporary table original_style_map (original text primary key, en text not null, family text not null);
insert into original_style_map values
  ('Schwarzbier', 'Schwarzbier', 'lager'), ('Cream Ale', 'Cream Ale', 'ale'), ('Radler', 'Radler', 'other');

create temporary table country_map (ja text primary key, en text not null);
insert into country_map values
  ('日本', 'Japan'), ('アメリカ', 'United States'), ('ベルギー', 'Belgium'), ('ドイツ', 'Germany'),
  ('チェコ', 'Czech Republic'), ('イギリス', 'United Kingdom'), ('アイルランド', 'Ireland'), ('オランダ', 'Netherlands'),
  ('デンマーク', 'Denmark'), ('カナダ', 'Canada'), ('オーストラリア', 'Australia'), ('ニュージーランド', 'New Zealand'),
  ('メキシコ', 'Mexico'), ('中国', 'China'), ('台湾', 'Taiwan'), ('韓国', 'South Korea'),
  ('ウクライナ', 'Ukraine'), ('イタリア', 'Italy'), ('フランス', 'France'), ('スペイン', 'Spain');

create temporary table prefecture_map (ja text primary key, en text not null);
insert into prefecture_map values
  ('北海道', 'Hokkaido'), ('青森県', 'Aomori'), ('岩手県', 'Iwate'), ('宮城県', 'Miyagi'), ('秋田県', 'Akita'),
  ('山形県', 'Yamagata'), ('福島県', 'Fukushima'), ('茨城県', 'Ibaraki'), ('栃木県', 'Tochigi'), ('群馬県', 'Gunma'),
  ('埼玉県', 'Saitama'), ('千葉県', 'Chiba'), ('東京都', 'Tokyo'), ('神奈川県', 'Kanagawa'), ('新潟県', 'Niigata'),
  ('富山県', 'Toyama'), ('石川県', 'Ishikawa'), ('福井県', 'Fukui'), ('山梨県', 'Yamanashi'), ('長野県', 'Nagano'),
  ('岐阜県', 'Gifu'), ('静岡県', 'Shizuoka'), ('愛知県', 'Aichi'), ('三重県', 'Mie'), ('滋賀県', 'Shiga'),
  ('京都府', 'Kyoto'), ('大阪府', 'Osaka'), ('兵庫県', 'Hyogo'), ('奈良県', 'Nara'), ('和歌山県', 'Wakayama'),
  ('鳥取県', 'Tottori'), ('島根県', 'Shimane'), ('岡山県', 'Okayama'), ('広島県', 'Hiroshima'), ('山口県', 'Yamaguchi'),
  ('徳島県', 'Tokushima'), ('香川県', 'Kagawa'), ('愛媛県', 'Ehime'), ('高知県', 'Kochi'), ('福岡県', 'Fukuoka'),
  ('佐賀県', 'Saga'), ('長崎県', 'Nagasaki'), ('熊本県', 'Kumamoto'), ('大分県', 'Oita'), ('宮崎県', 'Miyazaki'),
  ('鹿児島県', 'Kagoshima'), ('沖縄県', 'Okinawa');

-- 1行ずつ英語に直した drinks
create temporary table drinks_en as
select
  d.*,
  lower(regexp_replace(normalize(d.name, NFKC), '[[:space:]　]+', '', 'g')) as key,
  coalesce(os.en, cm.en, d.category) as category_en,
  case when d.kind = 'beer' then coalesce(os.family, cm.family, d.beer_family) end as family_en,
  coalesce(co.en, d.country, case when pm.en is not null or pa.en is not null then 'Japan' end) as country_en,
  coalesce(pm.en, pa.en) as prefecture_en,
  case
    when d.comment like '元の種類: %' then replace(d.comment, '元の種類: ', 'Original style: ')
    else d.comment
  end as comment_en
from public.drinks d
left join original_style_map os on d.comment = '元の種類: ' || os.original
left join category_map cm on cm.ja = d.category
left join country_map co on co.ja = d.country
left join prefecture_map pm on pm.ja = d.prefecture
-- 都道府県が空でも、所在地が「長野県松本市」のように都道府県で始まっていれば使う
left join lateral (
  select en from prefecture_map p where d.prefecture is null and d.maker_address like p.ja || '%' limit 1
) pa on true;

-- 地域: 日本は都道府県、海外は所在地から国名を除いた部分(例: "Ontario, Canada" → "Ontario")
alter table drinks_en add column region_en text;
update drinks_en set region_en = case
  when country_en = 'Japan' then prefecture_en
  else nullif(trim(both ', ' from regexp_replace(coalesce(maker_address, ''), ',?\s*' || coalesce(country_en, '$^') || '\s*$', '')), coalesce(country_en, ''))
end;
update drinks_en set region_en = null where region_en = '';

-- 銘柄: 同じ商品名(正規化して比較)は1つにまとめる。情報は保存済み → 新しいものを優先
insert into public.products (
  user_id, kind, name, name_key, maker, maker_address, region, country, lat, lng, abv, price_yen, price_note,
  category, beer_family, polish_ratio, sake_meter, acidity, rice, ai_filled_fields, sources, created_at
)
select distinct on (user_id, kind, key)
  user_id, kind, name, key, maker, maker_address, region_en, country_en, lat, lng, abv, price_yen, price_note,
  category_en, family_en, polish_ratio, sake_meter, acidity, rice, ai_filled_fields, sources, created_at
from drinks_en
order by user_id, kind, key, (status = 'saved') desc, updated_at desc;

-- 飲んだ記録: id は今までの記録と同じにする(写真の保存場所がそのまま使える)
insert into public.tastings (
  id, user_id, product_id, status, drunk_on, rating, bitterness, aroma, sweet_dry, light_rich, serving_temp,
  comment, image_path, created_at, updated_at
)
select
  d.id, d.user_id, p.id, d.status, d.drunk_on, d.rating, d.bitterness, d.aroma, d.sweet_dry, d.light_rich,
  d.serving_temp, d.comment_en, d.image_path, d.created_at, d.updated_at
from drinks_en d
join public.products p on p.user_id = d.user_id and p.kind = d.kind and p.name_key = d.key;

-- 今までのテーブルは名前を変えて残す
alter table public.drinks rename to drinks_old;

-- 調査結果のキャッシュは日本語のカテゴリが入っているので消す(次に調べたときに英語で作り直す)
delete from public.research_cache;

-- 移した件数の確認
select
  (select count(*) from public.drinks_old) as old_records,
  (select count(*) from public.tastings) as tastings,
  (select count(*) from public.products) as products;
