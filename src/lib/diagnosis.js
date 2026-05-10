const weights = {
  interest: 8,
  workStyle: 7,
  personality: 5,
  strongSubject: 5,
  favoriteSubject: 3,
  weakSubject: -3
};

export function diagnose(answers, departments) {
  const scored = departments.map((department) => {
    const reasons = [];
    let score = 0;
    const addMatches = (label, selected, target, weight) => {
      const matches = selected.filter((item) => target.includes(item));
      if (matches.length) {
        score += matches.length * weight;
        reasons.push(`${label}（${matches.join("、")}）と学びの方向性が重なっています`);
      }
    };
    addMatches("興味", answers.interests, department.tags, weights.interest);
    addMatches("働き方", answers.workStyles, department.workStyleFit, weights.workStyle);
    addMatches("性格傾向", answers.personalities, department.personalityFit, weights.personality);
    addMatches("得意科目", answers.strongSubjects, department.relatedSubjects, weights.strongSubject);
    addMatches("好きな教科", answers.favoriteSubjects, department.relatedSubjects, weights.favoriteSubject);
    const weakMatches = answers.weakSubjects.filter((item) => department.relatedSubjects.includes(item));
    if (weakMatches.length) {
      score += weakMatches.length * weights.weakSubject;
      reasons.push(`苦手科目（${weakMatches.join("、")}）が関わるため、学習負担の確認が必要です`);
    }
    if (department.bunriType === "文理融合" && answers.preferredBunri === "文理融合に興味") score += 6;
    if (department.bunriType === "文系" && answers.preferredBunri === "文系寄り") score += 4;
    if (department.bunriType === "理系" && answers.preferredBunri === "理系寄り") score += 4;
    return {
      department,
      score,
      recommendation: Math.max(35, Math.min(96, Math.round(50 + score * 2.1))),
      reasons: reasons.length ? reasons : ["回答との重なりは限定的ですが、視野を広げる候補として確認できます"]
    };
  });
  return scored.sort((a, b) => b.score - a.score || a.department.name.localeCompare(b.department.name, "ja"));
}

export function makeInterviewSummary(answers, results) {
  const top = results.slice(0, 5);
  const bunriCounts = top.reduce((acc, item) => {
    acc[item.department.bunriType] = (acc[item.department.bunriType] || 0) + 1;
    return acc;
  }, {});
  const bunriSuggestion = Object.entries(bunriCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "診断後に表示";
  const cautions = [];
  if (answers.weakSubjects.length) cautions.push(`苦手科目（${answers.weakSubjects.join("、")}）を避けるだけの選択になっていないか確認する`);
  if (answers.ngChecks.length) cautions.push(`危険な選択理由（${answers.ngChecks.join("、")}）が混ざっていないか深掘りする`);
  if (answers.workStyles.includes("まだわからない")) cautions.push("働き方が未定のため、職業名よりも興味や学び方から広げる");
  return {
    bunriSuggestion: top.length ? `${bunriSuggestion}の候補がやや多めです` : "診断後に表示",
    interestTrend: answers.interests.length ? answers.interests.join("、") : "未入力",
    cautionLevel: cautions.length ? "追加確認あり" : "大きな警戒サインは少なめ",
    strengths: [
      answers.strongSubjects.length ? `得意科目：${answers.strongSubjects.join("、")}` : "得意科目は面談で追加確認",
      answers.personalities.length ? `性格傾向：${answers.personalities.join("、")}` : "性格傾向は面談で追加確認",
      answers.interests.length ? "興味のタグから複数学部へ展開できる" : "興味の具体例を引き出す余地がある"
    ],
    cautions: cautions.length ? cautions : ["候補は可能性として扱い、本人の納得感と学習負担を確認する"],
    questionsToConfirm: [
      "なぜその分野に興味を持ったのか、具体的な経験はあるか",
      "大学での授業内容を見ても興味が続きそうか",
      "必要な科目、実習、資格条件を理解しているか",
      "似ている学部との違いを本人の言葉で説明できるか"
    ],
    parentMemo: [
      "結論を急がず、候補を複数示して比較する",
      "安定性や資格だけでなく、本人が続けられる学び方も確認する",
      "苦手回避ではなく、準備すれば伸ばせる点も話題にする"
    ]
  };
}

export function reverseLookupJobs(job, departments) {
  return departments
    .filter((department) => department.futureCareers.some((career) => career.includes(job)) || department.careerTags.includes(job))
    .slice(0, 6);
}
