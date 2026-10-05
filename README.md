# のみくらべ帳(beer_register)

ビールと日本酒の飲み比べを記録する、自分用のスマホ向けWebアプリです。
仕様は [docs/SPEC.md](docs/SPEC.md) にあります。

## 進み具合

| # | 内容 | 状態 |
| --- | --- | --- |
| 1 | 準備(雛形・テーマ色・フォント・切替ボタン・下タブ) | ✅ 完了 |
| 2 | ログインとDB(Supabase・Googleログイン) | ✅ 完了 |
| 3 | 記録の基本(記録・下書き・一覧・詳細・編集・削除・写真) | ✅ 完了 |
| 4 | AI自動入力 | これから |
| 5 | チャットで入力 | これから |
| 6 | 地図 | これから |
| 7 | レポート(ビール) | これから |
| 8 | 日本酒 | これから |
| 9 | 仕上げ(PWA・公開) | これから |

**レポート画面**に出ている銘柄や数字は、まだ**見た目確認用のサンプル**です(マイルストーン7で本物になります)。一覧・記録・詳細は本物のデータで動きます。

---

## 1. パソコンで動かす(Windows)

以下は **PowerShell** で行います。スタートメニューで「PowerShell」と検索して開いてください。

### 1-1. 必要なものを確認する

```powershell
node -v
git --version
```

- `node -v` が `v20` 以上(おすすめは `v22` 以上)ならOKです。古い・入っていない場合は https://nodejs.org/ja から「LTS」版を入れてください。
- `git --version` でエラーになる場合は https://git-scm.com/download/win から Git を入れてください(設定は全部そのままで「Next」でOK)。
- 入れたあとは PowerShell を一度閉じて開き直します。

### 1-2. ソースコードを手元に持ってくる(最初の1回だけ)

保存したいフォルダ(例: ドキュメント)に移動してから取り込みます。

```powershell
cd $HOME\Documents
git clone https://github.com/yukisoda1223/beer_register.git
cd beer_register
```

非公開リポジトリなので、初回はブラウザが開いて GitHub へのログインを求められます。画面の案内どおりに許可してください。

> 作業用のブランチを見る場合は、続けて `git checkout claude/beer-tasting-app-h3fzof` を実行します。

### 1-3. 部品をインストールする(最初の1回と、更新を取り込んだとき)

```powershell
npm install
```

### 1-4. 設定ファイルを作る

```powershell
Copy-Item .env.example .env.local
```

`.env.local` には Supabase の接続先などを書き込みます(「3. ログインの設定」)。**このファイルは他人に見せたり Git に入れたりしないでください**(`.gitignore` で除外済みです)。

`.env.local` はメモ帳で開けます: `notepad .env.local`

### 1-5. 起動する

```powershell
npm run dev
```

`Local: http://localhost:3000` と出たら、ブラウザで http://localhost:3000 を開きます。止めるときは PowerShell で `Ctrl + C` を押します。

### スマホの見た目で確認するには

Chrome で開いた状態で `F12` → `Ctrl + Shift + M` を押すと、スマホサイズで表示できます(上部の機種名から「iPhone 12 Pro」などを選べます)。

### 最新の内容を取り込むとき

```powershell
git pull
npm install
```

---

## 2. アカウントの準備

この先のマイルストーンで、次の3つのサービスを使います。**いまはアカウントを作るところまで**で大丈夫です。設定の中身は各マイルストーンで案内します。

### 2-1. Supabase(ログイン・データ保存・写真の保存)— マイルストーン2で使用

1. https://supabase.com を開き、右上の「Start your project」を押します。
2. 「Continue with GitHub」を選び、GitHub アカウントでログインします。
3. 組織(Organization)の名前を聞かれたら、自分の名前など何でもかまいません。プランは **Free** を選びます。
4. プロジェクトの作成はマイルストーン2で一緒に行います(ここではまだ作らなくてOK)。

### 2-2. Vercel(アプリをインターネットに公開する)— マイルストーン9で使用

1. https://vercel.com/signup を開きます。
2. プランは **Hobby**(個人・無料)を選びます。
3. 「Continue with GitHub」で GitHub アカウントと連携します。
4. 非公開リポジトリ `beer_register` を読めるよう許可を求められたら、許可してください。

### 2-3. Anthropic(Claude API・AI機能)— マイルストーン4で使用

1. https://platform.claude.com を開いてアカウントを作成します(旧 console.anthropic.com)。
2. API は使った分だけお金がかかります。「Billing」でクレジット(前払い)を少額(例: 5ドル)だけ入れておくと、使いすぎの心配がありません。
3. 「Limits」から月の利用上限を低めに設定しておくと安心です。
4. APIキーの作成と設定はマイルストーン4で一緒に行います。**APIキーは他人に教えたり、チャットやGitに貼ったりしないでください。**

---

## 3. ログインの設定(マイルストーン2)

上から順に進めてください。画面のメニュー名は、サービス側の変更で少し違うことがあります。

### 3-1. Supabase のプロジェクトを作る

1. https://supabase.com/dashboard を開いて「New project」。
2. 次のように入れて「Create new project」。
   - Name: `beer_register`
   - Database Password: 「Generate a password」で作り、**メモしておく**
   - Region: **Northeast Asia (Tokyo)**
3. 準備ができるまで1〜2分待ちます。

### 3-2. テーブルを作る(SQL を実行)

1. 左のメニューの「SQL Editor」を開き、「New query」。
2. このリポジトリの `supabase/migrations/20261005000000_init.sql` をメモ帳などで開き、**中身を全部コピーして貼り付け**、右下の「Run」。
3. 「Success. No rows returned」と出ればOK。
4. 確認: 「Table Editor」に `drinks` `research_cache` `ai_reports` `ai_usage` `geocode_cache` の5つ、「Storage」に `drink-images` があること。

> 2回目に実行すると「already exists」のエラーになります。1回だけ実行してください。

### 3-3. Google ログイン用の設定を作る(Google Cloud)

1. https://console.cloud.google.com を開き、上部のプロジェクト選択から「新しいプロジェクト」→ 名前 `beer-register` で作成し、そのプロジェクトを選びます。
2. 検索欄で「**Google Auth Platform**」を開き、「開始」(Get started)。
   - アプリ名: `のみくらべ帳`、ユーザーサポートメール: 自分のGmail
   - 対象(Audience): **外部(External)**
   - 連絡先メール: 自分のGmail → 同意して「作成」
3. 左の「対象」(Audience)→「テストユーザー」に**自分のGmailを追加**します。
   - アプリは「テスト中」のままでOKです。テスト中は、ここに入れたアカウントしか Google 側でログインできないので、より安全です。
4. 左の「クライアント」(Clients)→「クライアントを作成」。
   - アプリケーションの種類: **ウェブ アプリケーション**、名前: `beer_register`
   - 承認済みの JavaScript 生成元: `http://localhost:3000`
   - 承認済みのリダイレクト URI: `https://(SupabaseのプロジェクトID).supabase.co/auth/v1/callback`
     - この URL は、次の 3-4 で Supabase の Google 設定画面に「Callback URL (for OAuth)」として表示されるので、それをコピーするのが確実です。
5. 「作成」すると **クライアント ID** と **クライアント シークレット** が出るので、控えておきます(シークレットは他人に見せない)。

### 3-4. Supabase に Google ログインをつなぐ

1. Supabase の左メニュー「Authentication」→「Sign In / Providers」(または「Providers」)→「**Google**」。
2. 「Enable」をオンにし、3-3 の **Client ID** と **Client Secret** を貼って「Save」。
3. 「Authentication」→「URL Configuration」で次を設定して保存。
   - Site URL: `http://localhost:3000`
   - Redirect URLs に追加: `http://localhost:3000/**`

### 3-5. `.env.local` に値を入れる

Supabase の「Project Settings」→「API Keys」(Project URL は「Data API」や画面上部の「Connect」にもあります)で値を確認し、`.env.local` に入れます。

```
NEXT_PUBLIC_SUPABASE_URL=https://(プロジェクトID).supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ALLOWED_EMAIL=(ログインに使う自分のGmail)
```

保存したら、PowerShell で `Ctrl + C` で止めて、もう一度 `npm run dev`(`.env.local` を変えたら必ず起動し直す)。

### 3-6. 動作確認

1. http://localhost:3000 を開くと**ログイン画面**になる。
2. 「Googleでログイン」→ 自分のアカウントを選ぶ → レポート画面に移り、**一番下に「(メール) でログイン中」とログアウトボタン**が出る。
3. ログアウト → もう一度 http://localhost:3000 を開くとログイン画面に戻る。
4. (できれば)別のGoogleアカウントでは入れないことを確認する。
   - 3-3 のテストユーザーに別のアカウントも一時的に足してログインすると、「このアカウントは使えません」と出てログアウトされます。確認後はテストユーザーから外してください。

### 3-7. 仕上げ: 新しいユーザーの登録を止める

自分でログインできたら、Supabase の「Authentication」→「Sign In / Providers」の上部にある「**Allow new users to sign up**」をオフにして保存します。これで自分以外は Supabase にアカウントを作れなくなります。

### スマホで試す(同じ Wi-Fi の場合)

1. パソコンの IP アドレスを調べる: PowerShell で `ipconfig` → 「IPv4 アドレス」(例: `192.168.1.23`)。
2. `npm run dev -- -H 0.0.0.0` で起動する。Windows のファイアウォールの確認が出たら「プライベート ネットワーク」で許可。
3. Supabase の「URL Configuration」→ Redirect URLs に `http://192.168.1.23:3000/**`(自分の IP)を追加。
4. スマホのブラウザで `http://192.168.1.23:3000` を開いてログイン。

> うまくいかなくても大丈夫です。マイルストーン9でインターネットに公開すると、スマホからは普通に使えるようになります。

---

## 4. よく使うコマンド

| コマンド | すること |
| --- | --- |
| `npm run dev` | 開発用に起動する(http://localhost:3000) |
| `npm run build` | 公開用にビルドできるか確認する |
| `npm test` | 自動テストを実行する |
| `npm run lint` | コードの書き方をチェックする |

## 5. フォルダの中身(主なもの)

```
src/
├─ app/
│  ├─ page.tsx               # 「/」→ 最後に見ていた種類のレポートへ移る
│  ├─ login/                 # ログイン画面
│  ├─ auth/                  # Googleログインの戻り先・ログアウト
│  └─ [kind]/                # [kind] は beer か sake
│     ├─ layout.tsx          # ヘッダー(切替ボタン)と下タブ
│     ├─ report/page.tsx     # レポート
│     ├─ list/page.tsx       # 一覧
│     └─ [id]/page.tsx       # 記録の詳細(編集・削除ボタン)
├─ components/               # 切替ボタン・下タブ・★表示・アイコンなど
├─ lib/
│  ├─ auth.ts                # ログインを許可するメールの判定
│  ├─ supabase/              # Supabase への接続
│  ├─ kinds.ts               # お酒の種類と、切替のときの移動先
│  ├─ drink.ts               # 記録の型と、産地・日付の表示
│  └─ sample.ts              # 見た目確認用のサンプル(後で消す)
├─ styles/theme.css          # テーマ色(ビール/日本酒)
└─ proxy.ts                  # 未ログインならログイン画面へ移す
supabase/migrations/         # データベースを作る SQL
docs/SPEC.md                 # 仕様書
```
