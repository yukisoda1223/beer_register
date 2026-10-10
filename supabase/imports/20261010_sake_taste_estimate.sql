-- 日本酒 35 件(20261010_sake_records.sql で登録したもの)の Taste Map 用に、
-- 甘辛と香りの強さを銘柄の情報から推定して入れる。すでに入っている値は変えない。
-- Supabase の SQL Editor に全部貼り付けて「Run」。2回実行しても結果は同じ。
--   甘辛(1=甘口 … 5=辛口): 日本酒度 -6 以下=1 / -1.5 より下=2 / +3.5 以下=3 / +7.5 以下=4 / それより上=5(日本酒度が不明なら、名前に「辛口」があれば4、なければ空のまま)
--   香りの強さ(1=控えめ … 5=華やか): 大吟醸・純米大吟醸=4 / 吟醸・純米吟醸・Other=3 / それ以外=2

update public.tastings t
set
  sweet_dry = coalesce(t.sweet_dry, case
    when p.sake_meter is null and p.name like '%辛口%' then 4
    when p.sake_meter is null then null
    when p.sake_meter <= -6 then 1
    when p.sake_meter < -1.5 then 2
    when p.sake_meter <= 3.5 then 3
    when p.sake_meter <= 7.5 then 4
    else 5 end),
  aroma_level = coalesce(t.aroma_level, case
    when p.category in ('Junmai Daiginjo', 'Daiginjo') then 4
    when p.category in ('Junmai Ginjo', 'Ginjo', 'Other') then 3
    else 2 end)
from public.products p
where p.id = t.product_id
  and p.kind = 'sake'
  and p.name_key in (
    '愛宕の松本醸造',
    '瀧自慢辛口純米滝水流(はやせ)',
    'あたごのまつはるこい純米吟醸生酒',
    '松の寿日光囃子純米酒',
    '満寿泉純米吟醸pero',
    '日高見超辛口純米酒',
    '玉乃光純米吟醸酒魂',
    '酔鯨特別純米酒',
    '陸奥八仙特別純米(火入)',
    '飛露喜特別純米',
    '而今特別純米火入',
    '九頭龍純米',
    'くどき上手純米吟醸',
    '久保田千寿',
    '特別本醸造八海山',
    '獺祭純米大吟醸45',
    '越乃景虎龍',
    '田酒特別純米酒',
    '男山純米大吟醸',
    '一歩己純米酒',
    'うまからまんさく特別純米酒',
    '白瀑ど辛純米',
    '百十郎大辛口純米酒赤面(あかづら)',
    '来福特別純米真向勝負',
    'くどき上手ばくれん超辛口吟醸',
    '勝駒純米酒',
    '秋鹿山廃純米自営田山田錦火入原酒',
    '上喜元純米吟醸出羽燦々',
    '日本盛超特撰惣花純米吟醸',
    '日置桜純米酒',
    '千代むすび純米大吟醸強力50',
    '北鹿大吟醸北秋田',
    '加賀鳶山廃純米超辛口',
    '山本純米吟醸ピュアブラック',
    '龍力特別純米ドラゴン赤ラベル'
  );

-- 結果の確認(甘辛が空の銘柄は、日本酒度が分からなかったもの)
select p.name, p.sake_meter, p.category, t.sweet_dry, t.aroma_level
from public.tastings t join public.products p on p.id = t.product_id
where p.kind = 'sake'
order by t.sweet_dry nulls last, t.aroma_level desc;
