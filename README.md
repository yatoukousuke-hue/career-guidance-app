# 高校生進路指導管理アプリ

塾で継続的に使う「高校生進路指導管理アプリ」です。Phase 1/2として、ログイン、生徒ダッシュボード、管理者ダッシュボード、学部表示、生徒プロフィール保存、診断結果保存、管理者の生徒一覧を実装しています。

Supabase環境変数が未設定の場合はローカルモックで動作します。

## 起動方法

```bash
npm install
npm run dev
```

表示されたURLをブラウザで開いてください。

## 使用技術

- React
- Tailwind CSS
- Vite
- Supabase Auth
- Supabase PostgreSQL

## デモログイン

Supabase未設定時:

- 生徒: `student@demo.local` / `password`
- 管理者: `admin@demo.local` / `password`

## Phase 1/2 実装済み

- ログイン画面
- 生徒アカウント登録画面
- 生徒ダッシュボード
- 管理者ダッシュボード
- 学部・学科データ表示
- ローカルJSONでの仮データ表示
- Supabase接続クライアント
- Supabase Authでの登録・ログイン
- 生徒プロフィール保存
- 診断結果保存
- 管理者画面での生徒一覧表示

## Supabase設定方法

1. Supabaseでプロジェクトを作成します。
2. SQL Editorで `supabase/schema.sql` を実行します。
3. `.env.example` を参考に `.env` を作成します。

```bash
cp .env.example .env
```

必要な環境変数:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

秘密鍵やService Role Keyはフロントエンドに置かないでください。
`.env` はGitHubに上げず、`.env.example` だけをコミットしてください。

## Vercel公開手順

1. GitHubにこのプロジェクトをpushします。
2. Vercelで「Add New Project」からGitHubリポジトリを選択します。
3. Framework PresetはViteを選択します。
4. Build Commandは `npm run build`、Output Directoryは `dist` にします。
5. VercelのProject Settings > Environment Variablesに以下を登録します。

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

6. Deployを実行します。

このリポジトリには `vercel.json` を含めているため、Vercelは以下の設定でビルドします。

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- SPA用rewrite: すべてのパスを `/index.html` に戻す

## ローカル確認コマンド

```bash
npm run dev
npm run build
npm run preview
```

`npm run preview` はビルド済みの `dist` をローカル確認するためのコマンドです。

## データ構成

学部データは `src/data/departments.json` にあります。追加するときは既存データと同じ形式で1件追加してください。

主な項目:

- `id`
- `name`
- `category`
- `bunriType`
- `tags`
- `relatedSubjects`
- `personalityFit`
- `description`
- `learningContent`
- `futureCareers`
- `relatedQualifications`
- `recommendedFor`
- `notRecommendedFor`
- `highSchoolPreparation`
- `similarDepartments`
- `interviewQuestions`

検索や診断で使う補助項目:

- `workStyleFit`
- `typicalClasses`
- `careerTags`
- `stableFit`
- `professionalFit`

## 診断ロジック

`src/lib/diagnosis.js` に分離しています。

現在は以下をスコア化しています。

- 興味タグ
- 将来やってみたい働き方
- 性格傾向
- 得意科目
- 好きな教科
- 苦手科目
- 文理希望

診断結果は断定ではなく、面談で確認する「候補」として表示します。

## データアクセス層

Supabase連携は `src/lib/appRepository.js` に集約しています。画面側はRepositoryを呼ぶだけなので、Phase 3以降のアンケート保存、CSV出力、集計APIも同じ場所に追加できます。

## テーブル設計

`supabase/schema.sql` に以下を定義しています。

- `users`
- `students`
- `diagnosis_answers`
- `diagnosis_results`
- `interest_surveys`
- `saved_departments`
- `interview_surveys`
- `teacher_notes`
- `departments`

## Row Level Securityの考え方

- 生徒は自分の `students`、診断回答、診断結果だけ閲覧・保存できます。
- teacher/adminは生徒一覧、診断結果、集計元データを閲覧できます。
- `departments` はログイン済みユーザーが閲覧できます。
- 学部データ編集はadminのみを想定しています。

## 管理者アカウントの作り方

1. Supabase Authで管理者メールアドレスのユーザーを作成します。
2. SQL Editorで `users` に同じ `id` を `role = 'admin'` として登録します。

例:

```sql
insert into public.users (id, email, role)
values ('auth-users-id', 'admin@example.com', 'admin');
```

## 今後の拡張方法

- `departments.json` に学科単位のデータを増やす
- `src/data/options.js` に興味タグや職業を追加する
- `diagnosis.js` の重みを調整して塾の面談方針に合わせる
- Phase 3: 興味アンケート、面談前アンケート、生徒詳細、集計、CSV出力
- Phase 4: 面談優先度スコア、進路変化ログ、学部データ編集、先生コメントテンプレート
- 大学別データや入試科目データを別テーブルとして追加する

## 注意

医療系・資格系の進路は、大学の課程、国家試験、実習、年度ごとの制度確認が必要です。このアプリでは断定せず、面談で確認すべき観点として表示します。
