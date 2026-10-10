-- のみくらべ帳: 味の評価を「真ん中が0、−2.5〜+2.5、0.5刻み」のスライダーにそろえる
-- Supabase の「SQL Editor」にこのファイルの中身を全部貼り付けて「Run」で1回だけ実行する。
-- (20261010000000_more_kinds.sql を実行したあとに実行すること)
--
-- 変換のしかた(端を最大にそろえる)
--   5段階(甘辛・香りの強さ・ボディ): 1 → −2.5 / 2 → −1 / 3 → 0 / 4 → +1 / 5 → +2.5
--   ★(苦み・スモーキー): ★1 → −2.5 / ★2 → −1 / ★3 → 0 / ★4 → +1 / ★5 → +2.5、
--     ★0.5 → −2.5、★1.5 → −1.5、★2.5 → −0.5、★3.5 → +0.5、★4.5 → +1.5
--   共通の「香り★」は画面から外す。ビールだけ「香りの豊かさ」(aroma_level)が空なら香り★から移す。
--   香り★の値(aroma 列)は消さずに残す。

drop view public.drink_records;

-- ★ → スライダー
create function pg_temp.star_to_slider(v numeric) returns numeric language sql immutable as $$
  select case
    when v is null then null
    when v <= 1 then -2.5
    when v = 1.5 then -1.5
    when v = 2 then -1
    when v = 2.5 then -0.5
    when v = 3 then 0
    when v = 3.5 then 0.5
    when v = 4 then 1
    when v = 4.5 then 1.5
    else 2.5 end
$$;
-- 5段階 → スライダー
create function pg_temp.step_to_slider(v numeric) returns numeric language sql immutable as $$
  select case v when 1 then -2.5 when 2 then -1 when 3 then 0 when 4 then 1 when 5 then 2.5 end
$$;

alter table public.tastings
  drop constraint if exists tastings_sweet_dry_check,
  drop constraint if exists tastings_aroma_level_check,
  drop constraint if exists tastings_body_check,
  drop constraint if exists tastings_bitterness_check,
  drop constraint if exists tastings_smoky_check,
  drop constraint if exists drinks_sweet_dry_check,
  drop constraint if exists drinks_bitterness_check;

alter table public.tastings
  alter column sweet_dry   type numeric(2,1) using pg_temp.step_to_slider(sweet_dry),
  alter column aroma_level type numeric(2,1) using pg_temp.step_to_slider(aroma_level),
  alter column body        type numeric(2,1) using pg_temp.step_to_slider(body),
  alter column bitterness  type numeric(2,1) using pg_temp.star_to_slider(bitterness),
  alter column smoky       type numeric(2,1) using pg_temp.star_to_slider(smoky);

-- ビール: 香りの豊かさが空なら、香り★から移す
update public.tastings t
set aroma_level = pg_temp.star_to_slider(t.aroma)
from public.products p
where p.id = t.product_id and p.kind = 'beer' and t.aroma_level is null and t.aroma is not null;

alter table public.tastings
  add constraint tastings_sweet_dry_check   check (sweet_dry   between -2.5 and 2.5 and sweet_dry   * 2 = floor(sweet_dry   * 2)),
  add constraint tastings_aroma_level_check check (aroma_level between -2.5 and 2.5 and aroma_level * 2 = floor(aroma_level * 2)),
  add constraint tastings_body_check        check (body        between -2.5 and 2.5 and body        * 2 = floor(body        * 2)),
  add constraint tastings_bitterness_check  check (bitterness  between -2.5 and 2.5 and bitterness  * 2 = floor(bitterness  * 2)),
  add constraint tastings_smoky_check       check (smoky       between -2.5 and 2.5 and smoky       * 2 = floor(smoky       * 2));

-- 画面で読むビューを作り直す(中身は 20261010 と同じ)
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

-- 数字の意味が変わったので、AI の要約(Your Summary)は作り直してもらう
delete from public.ai_reports;
