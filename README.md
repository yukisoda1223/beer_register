# のみくらべ帳(beer_register)

ビールと日本酒の飲み比べを記録する、自分用のスマホ向けWebアプリです。
仕様は [docs/SPEC.md](docs/SPEC.md) にあります。

## 進み具合

| # | 内容 | 状態 |
| --- | --- | --- |
| 1 | 準備(雛形・テーマ色・フォント・切替ボタン・下タブ) | ✅ 完了 |
| 2 | ログインとDB(Supabase・Googleログイン) | これから |
| 3 | 記録の基本(記録・下書き・一覧・編集・削除・写真) | これから |
| 4 | AI自動入力 | これから |
| 5 | チャットで入力 | これから |
| 6 | 地図 | これから |
| 7 | レポート(ビール) | これから |
| 8 | 日本酒 | これから |
| 9 | 仕上げ(PWA・公開) | これから |

いまの画面に出ている銘柄や数字はすべて**見た目確認用のサンプル**です(架空の銘柄)。

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

`.env.local` には後のマイルストーンで APIキーなどを書き込みます。**このファイルは他人に見せたり Git に入れたりしないでください**(`.gitignore` で除外済みです)。マイルストーン1では空のままで動きます。

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

## 3. よく使うコマンド

| コマンド | すること |
| --- | --- |
| `npm run dev` | 開発用に起動する(http://localhost:3000) |
| `npm run build` | 公開用にビルドできるか確認する |
| `npm test` | 自動テストを実行する |
| `npm run lint` | コードの書き方をチェックする |

## 4. フォルダの中身(主なもの)

```
src/
├─ app/
│  ├─ page.tsx               # 「/」→ 最後に見ていた種類のレポートへ移る
│  └─ [kind]/                # [kind] は beer か sake
│     ├─ layout.tsx          # ヘッダー(切替ボタン)と下タブ
│     ├─ report/page.tsx     # レポート
│     └─ list/page.tsx       # 一覧
├─ components/               # 切替ボタン・下タブ・★表示・アイコンなど
├─ lib/
│  ├─ kinds.ts               # お酒の種類と、切替のときの移動先
│  └─ sample.ts              # 見た目確認用のサンプル(後で消す)
└─ styles/theme.css          # テーマ色(ビール/日本酒)
docs/SPEC.md                 # 仕様書
```
