import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Database,
  FileText,
  GraduationCap,
  Lock,
  LogOut,
  Search,
  ShieldCheck,
  UserPlus,
  Users
} from "lucide-react";
import { ngReasons, options } from "./data/options";
import {
  getCurrentUser,
  getDataMode,
  getDepartments,
  getStudentDiagnosisHistory,
  getStudentsForAdmin,
  saveDiagnosisForStudent,
  saveStudentProfile,
  signIn,
  signOut,
  signUpStudent
} from "./lib/appRepository";
import { makeInterviewSummary } from "./lib/diagnosis";
import "./styles.css";

const emptyAnswers = {
  favoriteSubjects: [],
  strongSubjects: [],
  weakSubjects: [],
  interests: [],
  workStyles: [],
  personalities: [],
  ngChecks: [],
  preferredBunri: "まだ未定"
};

const emptyProfile = {
  name: "",
  kana: "",
  grade: "高2",
  campus: "",
  teacher_name: "",
  bunri_status: "未定",
  career_memo: "",
  concern_memo: ""
};

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function SectionTitle({ icon: Icon, title, note }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-md bg-blue-50 p-2 text-blue-800"><Icon size={20} /></div>
      <div>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {note ? <p className="mt-1 text-sm text-slate-600">{note}</p> : null}
      </div>
    </div>
  );
}

function Chip({ selected, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm font-medium transition ${selected ? "border-blue-700 bg-blue-700 text-white" : "border-line bg-white text-ink hover:border-blue-400"}`}
    >
      {children}
    </button>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <label className="field">
      {label}
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  );
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [roleHint, setRoleHint] = useState("student");
  const [email, setEmail] = useState("student@demo.local");
  const [password, setPassword] = useState("password");
  const [profile, setProfile] = useState(emptyProfile);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      const user = await signIn({ email, password });
      onAuthenticated(user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      const user = await signUpStudent({ email, password, profile });
      onAuthenticated(user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const useDemo = (role) => {
    setMode("login");
    setRoleHint(role);
    setEmail(role === "admin" ? "admin@demo.local" : "student@demo.local");
    setPassword("password");
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 text-blue-800"><BookOpen size={26} /><span className="font-bold">進路面談管理</span></div>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-ink">高校生の診断、面談、志望変化を継続管理するWebアプリ</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">Phase 1/2として、認証、学生ダッシュボード、管理者ダッシュボード、プロフィール保存、診断結果保存、生徒一覧を実装しています。</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryBox label="認証" value="Supabase Auth対応" />
            <SummaryBox label="DB" value="RLS前提のPostgreSQL" />
            <SummaryBox label="未設定時" value="ローカルモックで動作" />
          </div>
          <div className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
            <p className="font-bold">デモログイン</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="secondary-button" onClick={() => useDemo("student")}>生徒デモ</button>
              <button className="secondary-button" onClick={() => useDemo("admin")}>管理者デモ</button>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="mb-4 flex gap-2">
            <button className={`nav-button ${mode === "login" ? "nav-active" : ""}`} onClick={() => setMode("login")}><Lock size={16} />ログイン</button>
            <button className={`nav-button ${mode === "signup" ? "nav-active" : ""}`} onClick={() => setMode("signup")}><UserPlus size={16} />生徒登録</button>
          </div>
          {mode === "login" ? (
            <div className="space-y-4">
              <SectionTitle icon={roleHint === "admin" ? ShieldCheck : GraduationCap} title="ログイン" note="Supabase未設定時はデモアカウントで動作します。" />
              <label className="field">メールアドレス<input className="input" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="field">パスワード<input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <button className="primary-button w-full" onClick={handleLogin}>ログイン</button>
            </div>
          ) : (
            <div className="space-y-4">
              <SectionTitle icon={UserPlus} title="生徒アカウント登録" note="本番ではSupabase Authにパスワードを保存し、アプリ側DBには保存しません。" />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field">氏名<input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
                <label className="field">フリガナ<input className="input" value={profile.kana} onChange={(e) => setProfile({ ...profile, kana: e.target.value })} /></label>
                <Select label="学年" value={profile.grade} onChange={(value) => setProfile({ ...profile, grade: value })}>{["高1", "高2", "高3", "既卒"].map((item) => <option key={item}>{item}</option>)}</Select>
                <Select label="文理選択状況" value={profile.bunri_status} onChange={(value) => setProfile({ ...profile, bunri_status: value })}>{["未定", "文系", "理系", "文理融合"].map((item) => <option key={item}>{item}</option>)}</Select>
                <label className="field">校舎<input className="input" value={profile.campus} onChange={(e) => setProfile({ ...profile, campus: e.target.value })} /></label>
                <label className="field">担当講師<input className="input" value={profile.teacher_name} onChange={(e) => setProfile({ ...profile, teacher_name: e.target.value })} /></label>
              </div>
              <label className="field">志望校・志望学部メモ<textarea className="input min-h-20" value={profile.career_memo} onChange={(e) => setProfile({ ...profile, career_memo: e.target.value })} /></label>
              <label className="field">現在の進路不安メモ<textarea className="input min-h-20" value={profile.concern_memo} onChange={(e) => setProfile({ ...profile, concern_memo: e.target.value })} /></label>
              <label className="field">メールアドレス<input className="input" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="field">パスワード<input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <button className="primary-button w-full" onClick={handleSignUp}>登録して開始</button>
            </div>
          )}
          {message ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm font-bold text-amber-900">{message}</p> : null}
        </section>
      </div>
    </main>
  );
}

function StudentDashboard({ user, departments, onUserChange }) {
  const [view, setView] = useState("home");
  const [answers, setAnswers] = useState({ ...emptyAnswers, preferredBunri: user.student?.bunri_status || "まだ未定" });
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const summary = useMemo(() => makeInterviewSummary(answers, results), [answers, results]);

  useEffect(() => {
    if (user.student?.id) getStudentDiagnosisHistory(user.student.id).then(setHistory);
  }, [user.student?.id]);

  const runDiagnosis = async () => {
    if (!user.student?.id) {
      setMessage("先にプロフィールを保存してください。");
      return;
    }
    const saved = await saveDiagnosisForStudent({ student: user.student, answers, departments });
    setResults(saved.results);
    setHistory(await getStudentDiagnosisHistory(user.student.id));
    setView("results");
  };

  const menu = [
    ["home", "ダッシュボード", GraduationCap],
    ["profile", "プロフィール", FileText],
    ["diagnosis", "進路診断", ClipboardList],
    ["results", "診断結果", BarChart3],
    ["departments", "学部検索", Search],
    ["history", "過去結果", BookOpen]
  ];

  return (
    <div className="space-y-5">
      <RoleHeader title={`${user.student?.name || "生徒"}さんの画面`} subtitle="診断、プロフィール、気になる学部を継続的に管理します。" />
      <TabNav items={menu} current={view} onChange={setView} />
      {message ? <p className="rounded-md bg-amber-50 p-3 text-sm font-bold text-amber-900">{message}</p> : null}
      {view === "home" && <StudentHome user={user} history={history} setView={setView} />}
      {view === "profile" && <ProfileForm user={user} onSaved={(student) => onUserChange({ ...user, student })} />}
      {view === "diagnosis" && <DiagnosisForm answers={answers} setAnswers={setAnswers} onDiagnose={runDiagnosis} />}
      {view === "results" && <Results results={results} summary={summary} />}
      {view === "departments" && <DepartmentSearch departments={departments} />}
      {view === "history" && <HistoryList history={history} />}
    </div>
  );
}

function StudentHome({ user, history, setView }) {
  const actions = [
    ["進路診断をする", "diagnosis"],
    ["気になる学部・学科を探す", "departments"],
    ["過去の診断結果を見る", "history"],
    ["自分の進路メモを書く", "profile"]
  ];
  return (
    <section className="panel">
      <SectionTitle icon={GraduationCap} title="生徒ダッシュボード" note="Phase 3で興味アンケート、面談前アンケート、保存済み学部を追加します。" />
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryBox label="学年" value={user.student?.grade || "未登録"} />
        <SummaryBox label="校舎" value={user.student?.campus || "未登録"} />
        <SummaryBox label="文理" value={user.student?.bunri_status || "未定"} />
        <SummaryBox label="診断回数" value={`${history.length}回`} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(([label, target]) => <button className="secondary-button" key={label} onClick={() => setView(target)}>{label}</button>)}
      </div>
    </section>
  );
}

function ProfileForm({ user, onSaved }) {
  const [profile, setProfile] = useState({ ...emptyProfile, ...(user.student || {}) });
  const [saved, setSaved] = useState(false);
  const update = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));
  const handleSave = async () => {
    const student = await saveStudentProfile(user, profile);
    onSaved(student);
    setSaved(true);
  };
  return (
    <section className="panel">
      <SectionTitle icon={FileText} title="プロフィール編集" note="Phase 2ではstudentsテーブルに保存します。" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="field">氏名<input className="input" value={profile.name || ""} onChange={(e) => update("name", e.target.value)} /></label>
        <label className="field">フリガナ<input className="input" value={profile.kana || ""} onChange={(e) => update("kana", e.target.value)} /></label>
        <Select label="学年" value={profile.grade || "高2"} onChange={(value) => update("grade", value)}>{["高1", "高2", "高3", "既卒"].map((item) => <option key={item}>{item}</option>)}</Select>
        <Select label="文理選択状況" value={profile.bunri_status || "未定"} onChange={(value) => update("bunri_status", value)}>{["未定", "文系", "理系", "文理融合"].map((item) => <option key={item}>{item}</option>)}</Select>
        <label className="field">校舎<input className="input" value={profile.campus || ""} onChange={(e) => update("campus", e.target.value)} /></label>
        <label className="field">担当講師<input className="input" value={profile.teacher_name || ""} onChange={(e) => update("teacher_name", e.target.value)} /></label>
      </div>
      <label className="field mt-3 block">志望校・志望学部メモ<textarea className="input min-h-24" value={profile.career_memo || ""} onChange={(e) => update("career_memo", e.target.value)} /></label>
      <label className="field mt-3 block">現在の進路不安メモ<textarea className="input min-h-24" value={profile.concern_memo || ""} onChange={(e) => update("concern_memo", e.target.value)} /></label>
      <button className="primary-button mt-4" onClick={handleSave}>プロフィールを保存</button>
      {saved ? <span className="ml-3 text-sm font-bold text-blue-800">保存しました</span> : null}
    </section>
  );
}

function DiagnosisForm({ answers, setAnswers, onDiagnose }) {
  const setList = (key, value) => setAnswers((prev) => ({ ...prev, [key]: toggleValue(prev[key], value) }));
  const groups = [
    ["favoriteSubjects", "好きな教科", options.subjects],
    ["strongSubjects", "得意な教科", options.subjects],
    ["weakSubjects", "苦手な教科", options.subjects],
    ["interests", "興味のあること", options.interests],
    ["workStyles", "将来やってみたい働き方", options.workStyles],
    ["personalities", "性格傾向", options.personalities]
  ];
  return (
    <div className="space-y-5">
      <section className="panel">
        <SectionTitle icon={ClipboardList} title="進路診断フォーム" note="回答は診断結果とあわせて保存され、後から変化を見られる設計です。" />
        <Select label="現時点の文理希望" value={answers.preferredBunri} onChange={(value) => setAnswers({ ...answers, preferredBunri: value })}>{["まだ未定", "文系寄り", "理系寄り", "文理融合に興味"].map((item) => <option key={item}>{item}</option>)}</Select>
      </section>
      {groups.map(([key, label, values]) => (
        <section className="panel" key={key}>
          <h3 className="mb-3 font-bold text-ink">{label}</h3>
          <div className="flex flex-wrap gap-2">{values.map((value) => <Chip key={value} selected={answers[key].includes(value)} onClick={() => setList(key, value)}>{value}</Chip>)}</div>
        </section>
      ))}
      <section className="panel border-amber-200 bg-amber-50">
        <h3 className="mb-3 font-bold text-amber-950">NG進路チェック</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {ngReasons.map((reason) => (
            <label key={reason} className="flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm">
              <input type="checkbox" checked={answers.ngChecks.includes(reason)} onChange={() => setList("ngChecks", reason)} />
              {reason}
            </label>
          ))}
        </div>
      </section>
      <button className="primary-button" onClick={onDiagnose}>診断して保存</button>
    </div>
  );
}

function Results({ results, summary }) {
  if (!results.length) return <div className="panel">診断後に結果が表示されます。</div>;
  return (
    <div className="space-y-5">
      <section className="panel">
        <SectionTitle icon={BarChart3} title="候補として考えられる学部・学科" note="断定ではなく、面談で広げるための候補です。" />
        <div className="grid gap-3 md:grid-cols-3">
          <SummaryBox label="文理選択サポート" value={summary.bunriSuggestion} />
          <SummaryBox label="興味傾向" value={summary.interestTrend} />
          <SummaryBox label="注意点" value={summary.cautionLevel} />
        </div>
      </section>
      {results.slice(0, 5).map((item, index) => <ResultCard key={item.department.id} item={item} rank={index + 1} />)}
    </div>
  );
}

function ResultCard({ item, rank }) {
  const dept = item.department;
  return (
    <article className="result-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-blue-700">{rank}位</p>
          <h3 className="text-xl font-bold text-ink">{dept.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{dept.category} / {dept.bunriType}</p>
        </div>
        <div className="rounded-md bg-blue-50 px-3 py-2 text-right">
          <div className="text-xs text-slate-600">おすすめ度</div>
          <div className="text-2xl font-bold text-blue-800">{item.recommendation}%</div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Info title="理由" items={item.reasons} />
        <Info title="学ぶ内容" text={dept.learningContent} />
        <Info title="将来の進路例" items={dept.futureCareers} />
        <Info title="面談で確認すべき質問" items={dept.interviewQuestions} />
      </div>
    </article>
  );
}

function DepartmentSearch({ departments }) {
  const [filters, setFilters] = useState({ q: "", bunri: "", category: "" });
  const categories = [...new Set(departments.map((department) => department.category))];
  const filtered = departments.filter((department) => {
    const text = [department.name, department.description, department.learningContent, ...(department.tags || [])].join(" ");
    return (!filters.q || text.includes(filters.q)) && (!filters.bunri || department.bunriType === filters.bunri) && (!filters.category || department.category === filters.category);
  });
  return (
    <div className="space-y-5">
      <section className="panel">
        <SectionTitle icon={Search} title="学部・学科データ表示" note="Phase 1はJSON、Phase 2以降はSupabaseのdepartmentsテーブルから取得できます。" />
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" placeholder="キーワード検索" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          <Select label="文理区分" value={filters.bunri} onChange={(value) => setFilters({ ...filters, bunri: value })}><option value="">指定なし</option>{["文系", "理系", "文理融合"].map((item) => <option key={item}>{item}</option>)}</Select>
          <Select label="学問分野" value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })}><option value="">指定なし</option>{categories.map((item) => <option key={item}>{item}</option>)}</Select>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((department) => <DepartmentDetail key={department.id} department={department} />)}
      </div>
    </div>
  );
}

function DepartmentDetail({ department }) {
  return (
    <article className="panel">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-ink">{department.name}</h3>
          <p className="text-sm text-slate-600">{department.category} / {department.bunriType}</p>
        </div>
        <div className="flex flex-wrap gap-1">{(department.tags || []).slice(0, 4).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      </div>
      <div className="mt-4 space-y-3">
        <Info title="学ぶ内容" text={department.learningContent} />
        <Info title="向いている人" items={department.recommendedFor} />
        <Info title="注意点" items={department.notRecommendedFor} tone="caution" />
        <Info title="将来の進路" items={department.futureCareers} />
      </div>
    </article>
  );
}

function HistoryList({ history }) {
  return (
    <section className="panel">
      <SectionTitle icon={BookOpen} title="過去の診断結果" note="Phase 2ではdiagnosis_resultsに保存した履歴を表示します。" />
      {history.length ? (
        <div className="space-y-3">
          {history.map((item) => (
            <div className="rounded-md border border-line bg-white p-4" key={item.id}>
              <p className="text-sm font-bold text-slate-500">{new Date(item.created_at).toLocaleString("ja-JP")}</p>
              <ul className="mt-2 text-sm text-slate-700">
                {(item.top_departments_json || []).map((department) => <li key={department.departmentId}>・{department.name}（{department.recommendation}%）</li>)}
              </ul>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-slate-600">まだ保存された診断結果はありません。</p>}
    </section>
  );
}

function AdminDashboard({ departments }) {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ grade: "", campus: "", teacher: "", bunri: "", diagnosis: "" });

  useEffect(() => {
    getStudentsForAdmin().then(setStudents);
  }, []);

  const filtered = students.filter((student) => (
    (!filters.grade || student.grade === filters.grade) &&
    (!filters.campus || student.campus?.includes(filters.campus)) &&
    (!filters.teacher || student.teacher_name?.includes(filters.teacher)) &&
    (!filters.bunri || student.bunri_status === filters.bunri) &&
    (!filters.diagnosis || (filters.diagnosis === "done" ? student.diagnosisCount > 0 : student.diagnosisCount === 0))
  ));
  const answered = students.filter((student) => student.diagnosisCount > 0).length;
  const bunriCounts = ["文系", "理系", "文理融合", "未定"].map((label) => [label, students.filter((student) => student.bunri_status === label).length]);
  const interestRank = buildInterestRank(students);
  const departmentRank = buildDepartmentRank(students, departments);
  const needInterview = students.filter((student) => student.bunri_status === "未定" || (student.concern_memo || "").length > 25);

  return (
    <div className="space-y-5">
      <RoleHeader title="管理者ダッシュボード" subtitle="生徒一覧、診断状況、面談前に見るべき情報を確認します。" />
      <section className="panel">
        <SectionTitle icon={ShieldCheck} title="全体サマリー" note="Phase 2ではstudentsとdiagnosis_resultsから集計します。" />
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryBox label="登録生徒数" value={`${students.length}人`} />
          <SummaryBox label="診断回答済み" value={`${answered}人`} />
          <SummaryBox label="未回答" value={`${students.length - answered}人`} />
          <SummaryBox label="面談対応候補" value={`${needInterview.length}人`} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <MiniRank title="興味分野ランキング" rows={interestRank} />
          <MiniRank title="関心学部ランキング" rows={departmentRank} />
          <MiniRank title="文理選択状況" rows={bunriCounts} />
        </div>
      </section>
      <section className="panel">
        <SectionTitle icon={Users} title="生徒一覧" note="学年、校舎、担当、文理、診断状況で絞り込めます。" />
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <Select label="学年" value={filters.grade} onChange={(value) => setFilters({ ...filters, grade: value })}><option value="">すべて</option>{["高1", "高2", "高3", "既卒"].map((item) => <option key={item}>{item}</option>)}</Select>
          <label className="field">校舎<input className="input" value={filters.campus} onChange={(e) => setFilters({ ...filters, campus: e.target.value })} /></label>
          <label className="field">担当講師<input className="input" value={filters.teacher} onChange={(e) => setFilters({ ...filters, teacher: e.target.value })} /></label>
          <Select label="文理" value={filters.bunri} onChange={(value) => setFilters({ ...filters, bunri: value })}><option value="">すべて</option>{["未定", "文系", "理系", "文理融合"].map((item) => <option key={item}>{item}</option>)}</Select>
          <Select label="診断" value={filters.diagnosis} onChange={(value) => setFilters({ ...filters, diagnosis: value })}><option value="">すべて</option><option value="done">診断済み</option><option value="none">未診断</option></Select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead><tr>{["氏名", "学年", "校舎", "担当講師", "文理", "最新診断", "おすすめTOP3", "面談メモ"].map((head) => <th className="table-head" key={head}>{head}</th>)}</tr></thead>
            <tbody>
              {filtered.map((student) => {
                const top = student.latestDiagnosis?.top_departments_json || [];
                return (
                  <tr key={student.id}>
                    <td className="table-cell font-bold text-ink">{student.name}</td>
                    <td className="table-cell">{student.grade}</td>
                    <td className="table-cell">{student.campus || "-"}</td>
                    <td className="table-cell">{student.teacher_name || "-"}</td>
                    <td className="table-cell">{student.bunri_status}</td>
                    <td className="table-cell">{student.latestDiagnosis ? new Date(student.latestDiagnosis.created_at).toLocaleDateString("ja-JP") : "未診断"}</td>
                    <td className="table-cell">{top.slice(0, 3).map((item) => item.name).join("、") || "-"}</td>
                    <td className="table-cell">{student.concern_memo ? "あり" : "なし"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <SectionTitle icon={BarChart3} title="Phase 3以降の拡張枠" note="興味アンケート、面談前アンケート、CSV出力、詳細画面はこの管理構成に追加できます。" />
        <div className="grid gap-3 md:grid-cols-4">
          {["興味分野集計", "未回答者一覧", "CSV出力", "面談優先度スコア"].map((item) => <div className="rounded-md border border-dashed border-line bg-panel p-4 text-sm font-bold text-slate-600" key={item}>{item}</div>)}
        </div>
      </section>
    </div>
  );
}

function buildInterestRank(students) {
  const counts = {};
  students.forEach((student) => {
    const results = student.latestDiagnosis?.result_json?.results || [];
    results[0]?.department?.tags?.forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function buildDepartmentRank(students) {
  const counts = {};
  students.forEach((student) => {
    (student.latestDiagnosis?.top_departments_json || []).slice(0, 3).forEach((item) => {
      counts[item.name] = (counts[item.name] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function MiniRank({ title, rows }) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <h3 className="mb-3 font-bold text-ink">{title}</h3>
      {rows.length ? rows.map(([label, value]) => (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm" key={label}>
          <span className="truncate text-slate-700">{label}</span>
          <span className="rounded bg-blue-50 px-2 py-1 font-bold text-blue-800">{value}</span>
        </div>
      )) : <p className="text-sm text-slate-500">データなし</p>}
    </div>
  );
}

function Info({ title, text, items, tone }) {
  return (
    <div>
      <h4 className={`mb-1 text-sm font-bold ${tone === "caution" ? "text-amber-800" : "text-ink"}`}>{title}</h4>
      {text ? <p className="text-sm leading-6 text-slate-700">{text}</p> : null}
      {items?.length ? <ul className="space-y-1 text-sm leading-6 text-slate-700">{items.map((item) => <li key={item}>・{item}</li>)}</ul> : null}
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </div>
  );
}

function RoleHeader({ title, subtitle }) {
  return (
    <section className="panel">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </section>
  );
}

function TabNav({ items, current, onChange }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map(([key, label, Icon]) => (
        <button className={`nav-button ${current === key ? "nav-active" : ""}`} key={key} onClick={() => onChange(key)}>
          <Icon size={16} />{label}
        </button>
      ))}
    </nav>
  );
}

function AppShell({ user, onLogout, children }) {
  const mode = getDataMode();
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-800"><BookOpen size={24} /><span className="font-bold">進路面談管理</span></div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-panel px-2 py-1"><Database size={14} />{mode === "supabase" ? "Supabase接続" : "ローカルモック"}</span>
              <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-blue-800">{user.role}</span>
            </div>
          </div>
          <button className="secondary-button" onClick={onLogout}><LogOut size={16} />ログアウト</button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCurrentUser(), getDepartments()]).then(([currentUser, departmentRows]) => {
      setUser(currentUser);
      setDepartments(departmentRows);
      setIsLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  if (isLoading) return <main className="min-h-screen bg-slate-100 p-6"><div className="panel">読み込み中です。</div></main>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;

  return (
    <AppShell user={user} onLogout={handleLogout}>
      {user.role === "student" ? <StudentDashboard user={user} departments={departments} onUserChange={setUser} /> : <AdminDashboard departments={departments} />}
    </AppShell>
  );
}

createRoot(document.getElementById("root")).render(<App />);
