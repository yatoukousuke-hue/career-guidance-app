import localDepartments from "../data/departments.json";
import { diagnose, makeInterviewSummary } from "./diagnosis";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const localKey = "career-guidance-local-state-v2";

const demoState = {
  users: [
    { id: "u-admin-1", email: "admin@demo.local", role: "admin" },
    { id: "u-student-1", email: "student@demo.local", role: "student" }
  ],
  students: [
    {
      id: "s-1",
      user_id: "u-student-1",
      name: "山田 花子",
      kana: "ヤマダ ハナコ",
      grade: "高2",
      campus: "本校",
      teacher_name: "佐藤先生",
      bunri_status: "未定",
      career_memo: "心理学部と教育学部が気になっている。",
      concern_memo: "文理選択と数学への不安がある。",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  diagnosisAnswers: [],
  diagnosisResults: [],
  savedDepartments: []
};

function loadLocalState() {
  const raw = localStorage.getItem(localKey);
  return raw ? JSON.parse(raw) : demoState;
}

function saveLocalState(state) {
  localStorage.setItem(localKey, JSON.stringify(state));
}

function toDepartment(row) {
  if (!row.bunri_type) return row;
  return {
    ...row,
    bunriType: row.bunri_type,
    relatedSubjects: row.related_subjects_json || [],
    personalityFit: row.personality_fit_json || [],
    learningContent: row.learning_content,
    futureCareers: row.future_careers_json || [],
    relatedQualifications: row.related_qualifications_json || [],
    recommendedFor: row.recommended_for || [],
    notRecommendedFor: row.not_recommended_for || [],
    highSchoolPreparation: row.high_school_preparation || [],
    similarDepartments: row.similar_departments_json || [],
    interviewQuestions: row.interview_questions_json || [],
    tags: row.tags_json || []
  };
}

export function getDataMode() {
  return isSupabaseConfigured ? "supabase" : "local";
}

export async function getDepartments() {
  if (!isSupabaseConfigured) return localDepartments;
  const { data, error } = await supabase.from("departments").select("*").order("name");
  if (error || !data?.length) return localDepartments;
  return data.map(toDepartment);
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    return JSON.parse(localStorage.getItem("career-guidance-current-user") || "null");
  }
  const { data } = await supabase.auth.getSession();
  const authUser = data.session?.user;
  if (!authUser) return null;
  const { data: appUser } = await supabase.from("users").select("*").eq("id", authUser.id).single();
  const { data: student } = await supabase.from("students").select("*").eq("user_id", authUser.id).maybeSingle();
  return { ...appUser, email: authUser.email, student };
}

export async function signIn({ email, password }) {
  if (!isSupabaseConfigured) {
    const state = loadLocalState();
    const user = state.users.find((item) => item.email === email);
    if (!user || password.length < 4) throw new Error("デモでは admin@demo.local または student@demo.local を使ってください。");
    const student = state.students.find((item) => item.user_id === user.id) || null;
    const sessionUser = { ...user, student };
    localStorage.setItem("career-guidance-current-user", JSON.stringify(sessionUser));
    return sessionUser;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: appUser } = await supabase.from("users").select("*").eq("id", data.user.id).single();
  const { data: student } = await supabase.from("students").select("*").eq("user_id", data.user.id).maybeSingle();
  return { ...appUser, email: data.user.email, student };
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    localStorage.removeItem("career-guidance-current-user");
    return;
  }
  await supabase.auth.signOut();
}

export async function signUpStudent({ email, password, profile }) {
  if (!isSupabaseConfigured) {
    const state = loadLocalState();
    const user = { id: crypto.randomUUID(), email, role: "student", created_at: new Date().toISOString() };
    const student = {
      id: crypto.randomUUID(),
      user_id: user.id,
      ...profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    state.users.push(user);
    state.students.push(student);
    saveLocalState(state);
    const sessionUser = { ...user, student };
    localStorage.setItem("career-guidance-current-user", JSON.stringify(sessionUser));
    return sessionUser;
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const userId = data.user.id;
  await supabase.from("users").insert({ id: userId, email, role: "student" });
  const { data: student, error: profileError } = await supabase
    .from("students")
    .insert({ user_id: userId, ...profile })
    .select("*")
    .single();
  if (profileError) throw profileError;
  return { id: userId, email, role: "student", student };
}

export async function saveStudentProfile(user, profile) {
  if (!isSupabaseConfigured) {
    const state = loadLocalState();
    const index = state.students.findIndex((item) => item.user_id === user.id);
    const next = { ...(state.students[index] || {}), ...profile, user_id: user.id, updated_at: new Date().toISOString() };
    if (index >= 0) state.students[index] = next;
    else state.students.push({ ...next, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    saveLocalState(state);
    const sessionUser = { ...user, student: next };
    localStorage.setItem("career-guidance-current-user", JSON.stringify(sessionUser));
    return next;
  }
  const { data, error } = await supabase
    .from("students")
    .upsert({ user_id: user.id, ...profile, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function saveDiagnosisForStudent({ student, answers, departments }) {
  const results = diagnose(answers, departments);
  const summary = makeInterviewSummary(answers, results);
  const topDepartments = results.slice(0, 5).map((item) => ({
    departmentId: item.department.id,
    name: item.department.name,
    recommendation: item.recommendation,
    reasons: item.reasons
  }));
  if (!isSupabaseConfigured) {
    const state = loadLocalState();
    const createdAt = new Date().toISOString();
    state.diagnosisAnswers.push({ id: crypto.randomUUID(), student_id: student.id, answers_json: answers, created_at: createdAt });
    state.diagnosisResults.push({ id: crypto.randomUUID(), student_id: student.id, result_json: { results, summary }, top_departments_json: topDepartments, created_at: createdAt });
    saveLocalState(state);
    return { results, summary };
  }
  await supabase.from("diagnosis_answers").insert({ student_id: student.id, answers_json: answers });
  await supabase.from("diagnosis_results").insert({
    student_id: student.id,
    result_json: { results, summary },
    top_departments_json: topDepartments
  });
  return { results, summary };
}

export async function getStudentDiagnosisHistory(studentId) {
  if (!isSupabaseConfigured) {
    return loadLocalState().diagnosisResults.filter((item) => item.student_id === studentId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await supabase.from("diagnosis_results").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getStudentsForAdmin() {
  if (!isSupabaseConfigured) {
    const state = loadLocalState();
    return state.students.map((student) => {
      const history = state.diagnosisResults.filter((item) => item.student_id === student.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
      const latest = history[0];
      return { ...student, latestDiagnosis: latest || null, diagnosisCount: history.length };
    });
  }
  const { data, error } = await supabase.from("students").select("*, diagnosis_results(*)").order("updated_at", { ascending: false });
  if (error) throw error;
  return data.map((student) => ({
    ...student,
    latestDiagnosis: [...(student.diagnosis_results || [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null,
    diagnosisCount: student.diagnosis_results?.length || 0
  }));
}
