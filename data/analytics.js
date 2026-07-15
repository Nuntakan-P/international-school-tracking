/* ============================================================
   analytics.js — pure aggregation helpers.
   Every function takes an array of school records (already
   filtered) and returns plain objects ready for rendering.
   ============================================================ */
(function () {
  const STAGES = window.FUNNEL_STAGES || ["Call", "Visit", "Demo", "Survey", "Present", "PO", "Install"];
  const sum = (a) => a.reduce((s, x) => s + (x || 0), 0);
  const money = (a, key) => sum(a.map((d) => d[key] || 0));

  function kpis(rows) {
    const active = rows.filter((d) => d.active);
    const reScores = rows.map((d) => d.reScore).filter((x) => x > 0);
    const winProjects = sum(rows.map((d) => d.winProjects || 0));
    const lostProjects = sum(rows.map((d) => d.lostProjects || 0));
    const winSchools = rows.filter((d) => d.isWinSchool).length;
    const winValue = sum(rows.map((d) => d.winValue || 0));
    const quotationActions = sum(rows.map((d) => d.quotationActions || 0));
    const poInstallActions = sum(rows.map((d) => d.poInstallActions || 0));
    return {
      totalSchools: rows.length,
      activeSchools: active.length,
      activeOpportunities: active.length,
      activeProjects: sum(rows.map((d) => d.activeProjects || 0)),
      activePct: rows.length ? Math.round((active.length / rows.length) * 100) : 0,
      totalProjectValue: money(rows, "projectValue"),
      weightedPipeline: money(rows, "weightedValue"),
      // Win Rate = ΣWin / Σ(Win+Lost) across all project blocks
      winRate: (winProjects + lostProjects) ? Math.round((winProjects / (winProjects + lostProjects)) * 100) : 0,
      winProjects, lostProjects, winSchools, winValue,
      wins: winProjects,
      // Win Conversion = ΣQuotation / Σ(PO+Install) from Updated Action
      winConversionRate: poInstallActions ? Math.round((quotationActions / poInstallActions) * 100) : 0,
      quotationActions, poInstallActions,
      // Lost metrics
      lostRate: (winProjects + lostProjects) ? Math.round((lostProjects / (winProjects + lostProjects)) * 100) : 0,
      lostSchools: rows.filter((d) => d.isLostSchool).length,
      lostValue: sum(rows.map((d) => d.lostValue || 0)),
      // Lost Conversion = [(PO+Install) - Quotation] / (PO+Install)
      lostConversionRate: poInstallActions ? Math.round(((poInstallActions - quotationActions) / poInstallActions) * 100) : 0,
      // Consider (Lead + Consider) metrics from project blocks
      considerSchools: rows.filter((d) => d.isConsiderSchool).length,
      considerProjects: sum(rows.map((d) => d.considerProjects || 0)),
      considerValue: sum(rows.map((d) => d.considerValue || 0)),
      considerChance: (function () {
        let total = 0, count = 0;
        rows.forEach((d) => (d.projects || []).forEach((p) => {
          if (/^(lead|consider)/i.test(p.status)) { total += p.chance; count++; }
        }));
        return count ? Math.round(total / count) : 0;
      })(),
      // breakdown: Lead vs Consider separately
      leadSchools: rows.filter((d) => (d.projects || []).some((p) => /^lead$/i.test(p.status))).length,
      leadProjects: sum(rows.map((d) => (d.projects || []).filter((p) => /^lead$/i.test(p.status)).length)),
      leadValue: sum(rows.map((d) => (d.projects || []).filter((p) => /^lead$/i.test(p.status)).reduce((a, p) => a + p.projectValue, 0))),
      considerOnlySchools: rows.filter((d) => (d.projects || []).some((p) => /^consider/i.test(p.status) && !/^lead$/i.test(p.status))).length,
      considerOnlyProjects: sum(rows.map((d) => (d.projects || []).filter((p) => /^consider/i.test(p.status)).length)),
      considerOnlyValue: sum(rows.map((d) => (d.projects || []).filter((p) => /^consider/i.test(p.status)).reduce((a, p) => a + p.projectValue, 0))),
      avgReScore: reScores.length ? Math.round(sum(reScores) / reScores.length) : 0,
      openFollowUps: rows.filter((d) => !/^(win|lost)/i.test(d.status)).length,
      openFollowUpsProjects: sum(rows.filter((d) => !/^(win|lost)/i.test(d.status)).map((d) => d.numProjects || 1)),
      updatedThisMonth: rows.filter((d) => d.updatedThisMonth).length,
      updatedThisMonthProjects: sum(rows.filter((d) => d.updatedThisMonth).map((d) => d.numProjects || 1)),
      totalProjects: sum(rows.map((d) => d.numProjects || 1)),
      highChanceProjects: sum(rows.map((d) => (d.projects || []).filter((p) => p.chance >= 70).length)),
    };
  }

  // Cumulative funnel — schools that reached at least each stage
  function funnel(rows) {
    const total = rows.length || 1;
    return STAGES.map((stage, i) => {
      const count = rows.filter((d) => d.funnelIdx >= i).length;
      return { stage, count, pct: count / total };
    });
  }

  function salesperson(rows) {
    const names = [...new Set(rows.map((d) => d.salesperson))].sort();
    return names.map((name) => {
      const r = rows.filter((d) => d.salesperson === name);
      return {
        name,
        pipeline: money(r, "weightedValue"),
        projectValue: money(r, "projectValue"),
        poCount: r.filter((d) => d.funnelIdx >= 5).length,
        installCount: r.filter((d) => d.funnelIdx >= 6).length,
        schools: r.length,
      };
    });
  }

  function byProvince(rows) {
    const map = {};
    rows.forEach((d) => {
      if (!map[d.province]) map[d.province] = { value: 0, schools: [], totalProjects: 0 };
      map[d.province].value += d.projectValue;
      map[d.province].schools.push({ name: d.name, grade: d.grade });
      map[d.province].totalProjects += (d.numProjects || 1);
    });
    return Object.entries(map)
      .map(([province, o]) => ({ province, value: o.value, schoolCount: o.schools.length, schools: o.schools, totalProjects: o.totalProjects }))
      .sort((a, b) => b.value - a.value);
  }

  // 2x2 tier matrix HH/HL/LH/LL with counts + summed pipeline value
  function tierMatrix(rows) {
    const out = {};
    ["HH", "HL", "LH", "LL"].forEach((t) => {
      const r = rows.filter((d) => d.tier === t);
      out[t] = { count: r.length, value: money(r, "projectValue") };
    });
    return out;
  }

  function curriculum(rows) {
    const map = {};
    rows.forEach((d) => { map[d.curriculum] = (map[d.curriculum] || 0) + 1; });
    const total = rows.length || 1;
    let arr = Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    // keep top 6, bucket the rest into "Other" so the donut stays readable
    if (arr.length > 7) {
      const head = arr.slice(0, 6);
      const other = arr.slice(6).reduce((s, x) => s + x.count, 0);
      arr = [...head, { name: "Other", count: other }];
    }
    return arr.map((d) => ({ name: d.name, count: d.count, pct: d.count / total }));
  }

  function topOpportunities(rows, n) {
    return [...rows]
      .sort((a, b) => b.projectValue - a.projectValue)
      .slice(0, n || 20);
  }

  function scoreImprovement(rows) {
    let improved = 0, same = 0, decreased = 0;
    rows.forEach((d) => {
      const diff = d.reScore - d.initialScore;
      if (diff > 0) improved++; else if (diff < 0) decreased++; else same++;
    });
    const total = rows.length || 1;
    return {
      improved, same, decreased,
      improvedPct: Math.round((improved / total) * 100),
      samePct: Math.round((same / total) * 100),
      decreasedPct: Math.round((decreased / total) * 100),
    };
  }

  function averageScoreByTier(rows) {
    const grades = ["A", "B", "C", "D"];
    const round = (x) => Math.round(x);
    const result = grades.map((g) => {
      const r = rows.filter((d) => d.grade === g);
      const ini = r.length ? sum(r.map((d) => d.initialScore)) / r.length : 0;
      const re = r.length ? sum(r.map((d) => d.reScore)) / r.length : 0;
      return { tier: g, initial: round(ini), reScore: round(re), change: round(re - ini), n: r.length };
    });
    const iniAll = rows.length ? sum(rows.map((d) => d.initialScore)) / rows.length : 0;
    const reAll = rows.length ? sum(rows.map((d) => d.reScore)) / rows.length : 0;
    result.push({ tier: "Total", initial: round(iniAll), reScore: round(reAll), change: round(reAll - iniAll), n: rows.length });
    return result;
  }

  function scoreDistribution(rows) {
    const buckets = [
      { label: "0-20", lo: 0, hi: 20 }, { label: "21-40", lo: 21, hi: 40 },
      { label: "41-60", lo: 41, hi: 60 }, { label: "61-80", lo: 61, hi: 80 },
      { label: "81-100", lo: 81, hi: 100 },
    ];
    const total = rows.length || 1;
    return buckets.map((b) => {
      const count = rows.filter((d) => d.reScore >= b.lo && d.reScore <= b.hi).length;
      return { label: b.label, count, pct: Math.round((count / total) * 100) };
    });
  }

  function scatter(rows) {
    return rows.map((d) => ({
      x: d.initialScore, y: d.reScore, grade: d.grade, name: d.name,
    }));
  }

  // Plan vs Actual — aggregated with filters (person, month, grade)
  // planActual = { stages, persons[], granular[{ person, school, grade, month, plan[8], actual[8] }] }
  // Legacy format (seed) = { stages, Somjit:{plan,actual}, Wassana:{plan,actual} }
  function planVsActual(planActual, salesFilter, monthFilter, gradeFilter) {
    const stages = planActual.stages || window.FUNNEL_STAGES;

    // --- Legacy seed format ---
    if (!planActual.granular) {
      const names = salesFilter && salesFilter !== "All"
        ? [salesFilter]
        : Object.keys(planActual).filter((k) => k !== "stages");
      const plan = stages.map(() => 0), actual = stages.map(() => 0);
      names.forEach((nm) => {
        if (!planActual[nm]) return;
        planActual[nm].plan.forEach((v, i) => (plan[i] += v));
        planActual[nm].actual.forEach((v, i) => (actual[i] += v));
      });
      const rows = stages.map((stage, i) => ({
        stage, plan: plan[i], actual: actual[i],
        pct: plan[i] ? Math.round((actual[i] / plan[i]) * 100) : 0,
      }));
      const totalPlan = sum(plan), totalActual = sum(actual);
      return { rows, totalPlan, totalActual, achievement: totalPlan ? Math.round((totalActual / totalPlan) * 100) : 0 };
    }

    // --- Granular format ---
    let filtered = planActual.granular;
    if (salesFilter && salesFilter !== "All") filtered = filtered.filter((g) => g.person === salesFilter);
    if (monthFilter && monthFilter !== "All") filtered = filtered.filter((g) => g.month === monthFilter);
    if (gradeFilter && gradeFilter !== "All") filtered = filtered.filter((g) => g.grade === gradeFilter);

    const plan = stages.map(() => 0), actual = stages.map(() => 0);
    filtered.forEach((g) => {
      for (let s = 0; s < 8; s++) { plan[s] += g.plan[s]; actual[s] += g.actual[s]; }
    });
    const rows = stages.map((stage, i) => ({
      stage, plan: plan[i], actual: actual[i],
      pct: plan[i] ? Math.round((actual[i] / plan[i]) * 100) : 0,
    }));
    const totalPlan = sum(plan), totalActual = sum(actual);
    return { rows, totalPlan, totalActual, achievement: totalPlan ? Math.round((totalActual / totalPlan) * 100) : 0 };
  }

  function gradeMatrix(rows) {
    const out = {};
    ["A","B","C","D"].forEach(g => {
      const r = rows.filter(d => d.grade === g);
      const totalProj = sum(r.map(d => d.numProjects || 1));
      // High-chance (≥70%): count schools and projects that have ≥1 project with chance≥70
      let hcSchools = 0, hcProjects = 0, hcValue = 0;
      r.forEach(d => {
        const hcProjs = (d.projects || []).filter(p => p.chance >= 70);
        if (hcProjs.length > 0) hcSchools++;
        hcProjects += hcProjs.length;
        hcValue += sum(hcProjs.map(p => p.projectValue));
      });
      out[g] = { count: r.length, value: money(r, "projectValue"), projects: totalProj,
                 hcSchools, hcProjects, hcValue };
    });
    return out;
  }

  // Pipeline rows respecting a project filter ("All" | "1".."4")
  // Sort order: Re-Score grade A>B>C>D, then Point-Re-Score desc, then Chance desc.
  function pipelineRows(rows, projectFilter) {
    const gradeRank = { A: 0, B: 1, C: 2, D: 3 };
    const sorter = (a, b) =>
      ((gradeRank[a.grade] ?? 9) - (gradeRank[b.grade] ?? 9)) ||
      (b.reScore - a.reScore) ||
      (b.chance - a.chance);
    if (!projectFilter || projectFilter === "All") {
      return [...rows]
        .map((s) => ({
          no: s.no, name: s.name, province: s.province, funnel: s.funnel,
          projectValue: s.projectValue, chance: s.chance, weightedValue: s.weightedValue,
          salesperson: s.salesperson, grade: s.grade, reScore: s.reScore,
          tier: s.tier, projectLabel: (s.numProjects || 1) + " proj",
          updatedAction: s.updatedAction || "", updatedDate: s.updatedDate || "",
          followUpAction: s.followUpAction || "", followUpDate: s.followUpDate || "",
        }))
        .sort(sorter);
    }
    const n = parseInt(projectFilter);
    const out = [];
    rows.forEach((s) => {
      const pr = (s.projects || []).find((p) => p.projectNo === n);
      if (!pr) return;
      out.push({
        no: s.no, name: s.name, province: s.province, funnel: pr.funnel,
        projectValue: pr.projectValue, chance: pr.chance, weightedValue: pr.weightedValue,
        salesperson: s.salesperson, grade: s.grade, reScore: s.reScore,
        tier: s.tier, projectLabel: "Project#" + n,
        updatedAction: pr.updatedAction || "", updatedDate: pr.updatedDate || "",
        followUpAction: pr.followUpAction || "", followUpDate: pr.followUpDate || "",
      });
    });
    return out.sort(sorter);
  }

  window.Analytics = {
    kpis, funnel, salesperson, byProvince, tierMatrix, gradeMatrix, curriculum,
    topOpportunities, scoreImprovement, averageScoreByTier,
    scoreDistribution, scatter, planVsActual, pipelineRows,
  };
})();
