const Performance = require('../models/Performance');
const PerformanceScopeService = require('./PerformanceScopeService');

class ReviewService {
  static calculateReviewData(evaluations = []) {
    // Normalize input: handle either flat array or nested KRA array with kpis: [...]
    let flatItems = [];
    if (Array.isArray(evaluations)) {
      for (const item of evaluations) {
        if (item && Array.isArray(item.kpis) && item.kpis.length > 0) {
          for (const subKpi of item.kpis) {
            flatItems.push({
              kra_id: item.kra_id,
              kra_title: item.kra_title || item.title,
              kra_weightage: item.kra_weightage !== undefined ? item.kra_weightage : (item.weightage !== undefined ? item.weightage : 0),
              kpi_id: subKpi.kpi_id || subKpi.id,
              kpi_title: subKpi.kpi_title || subKpi.title,
              measurement_type: subKpi.measurement_type || 'Numeric',
              target_value: subKpi.target_value,
              actual_achievement: subKpi.actual_achievement !== undefined ? subKpi.actual_achievement : subKpi.actual_value,
              comments: subKpi.comments || ''
            });
          }
        } else {
          flatItems.push({
            ...item,
            kra_weightage: item.kra_weightage !== undefined ? item.kra_weightage : (item.weightage !== undefined ? item.weightage : 0),
            actual_achievement: item.actual_achievement !== undefined ? item.actual_achievement : item.actual_value
          });
        }
      }
    }

    const kraMap = new Map();
    let totalWeightage = 0;

    for (const item of flatItems) {
      const kraKey = item.kra_id !== undefined && item.kra_id !== null ? String(item.kra_id) : (item.kra_title || 'General KRA');
      if (!kraMap.has(kraKey)) {
        const kraWeightage = Number(item.kra_weightage) || 0;
        kraMap.set(kraKey, {
          kra_id: item.kra_id || null,
          kra_title: item.kra_title || 'Key Result Area',
          kra_weightage: kraWeightage,
          kpis: []
        });
        totalWeightage += kraWeightage;
      }

      const targetVal = parseFloat(item.target_value) || 0;
      const actualVal = parseFloat(item.actual_achievement) || 0;
      let achievementPercentage = 0;
      if (targetVal > 0) {
        achievementPercentage = Math.min(200, Math.round(((actualVal / targetVal) * 100) * 100) / 100);
      } else if (actualVal > 0) {
        achievementPercentage = 100;
      } else {
        achievementPercentage = 0;
      }

      kraMap.get(kraKey).kpis.push({
        ...item,
        target_value: targetVal,
        actual_achievement: actualVal,
        achievement_percentage: achievementPercentage
      });
    }

    let finalScore = 0;
    const processedEvaluations = [];
    const kraSummaries = [];

    for (const [kraKey, kra] of kraMap.entries()) {
      const kpiCount = kra.kpis.length;
      let kraAchievementPct = 0;
      if (kpiCount > 0) {
        const sumKpiPct = kra.kpis.reduce((acc, k) => acc + k.achievement_percentage, 0);
        kraAchievementPct = Math.round((sumKpiPct / kpiCount) * 100) / 100;
      }
      
      const kraWeightedScore = Math.round(((kraAchievementPct * kra.kra_weightage) / 100) * 100) / 100;
      finalScore += kraWeightedScore;

      kraSummaries.push({
        kra_id: kra.kra_id,
        kra_title: kra.kra_title,
        kra_weightage: kra.kra_weightage,
        kra_achievement_percentage: kraAchievementPct,
        kra_weighted_score: kraWeightedScore,
        kpi_count: kpiCount
      });

      for (const kpi of kra.kpis) {
        const kpiWeightedScore = kpiCount > 0 ? Math.round(((kpi.achievement_percentage * kra.kra_weightage) / (100 * kpiCount)) * 100) / 100 : 0;
        processedEvaluations.push({
          kra_id: kra.kra_id,
          kpi_id: kpi.kpi_id || null,
          kra_title_snapshot: kra.kra_title,
          kra_weightage_snapshot: kra.kra_weightage,
          kpi_name_snapshot: kpi.kpi_name || kpi.kpi_title || kpi.title || 'KPI Target',
          measurement_type_snapshot: kpi.measurement_type || 'Percentage',
          target_value_snapshot: kpi.target_value,
          actual_achievement: kpi.actual_achievement,
          achievement_percentage: kpi.achievement_percentage,
          weighted_score: kpiWeightedScore
        });
      }
    }

    finalScore = Math.round(finalScore * 100) / 100;
    totalWeightage = Math.round(totalWeightage * 100) / 100;
    const isValidWeightage = evaluations.length === 0 || Math.abs(totalWeightage - 100) <= 0.05;
    const ratingOut5 = Math.min(5, Math.max(1, Math.round((finalScore / 20) * 10) / 10)).toFixed(1);

    return {
      evaluations: processedEvaluations,
      kraSummaries,
      finalScore,
      totalWeightage,
      isValidWeightage,
      overallRating: ratingOut5
    };
  }

  static async calculatePreview(data) {
    const evaluations = data.evaluations || [];
    return this.calculateReviewData(evaluations);
  }

  static async create(data, userId) {
    const calc = this.calculateReviewData(data.evaluations || []);

    if (data.status === 'Completed' && !calc.isValidWeightage && data.evaluations && data.evaluations.length > 0) {
      throw new Error(`Total KRA weightage must equal 100% to finalize a review (currently ${calc.totalWeightage}%).`);
    }

    const finalScore = calc.finalScore !== undefined ? calc.finalScore : (data.final_score || null);
    const totalWeightage = calc.totalWeightage !== undefined ? calc.totalWeightage : (data.total_weightage || null);
    const overallRating = data.overall_rating || calc.overallRating || '5.0';

    const sql = `
      INSERT INTO reviews (
        employee_id, goal_id, review_period, reviewer_id, type, overall_rating,
        final_score, total_weightage, strengths, improvement, goals, comments, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.employee_id, data.goal_id || null, data.review_period, data.reviewer_id, data.type, overallRating,
      finalScore, totalWeightage, data.strengths || null, data.improvement || null, data.goals || null, data.comments || null,
      data.status || 'In Progress', userId, userId
    ];

    await Performance.beginTransaction();
    try {
      const result = await Performance.query(sql, params);
      const reviewId = result.insertId;

      if (calc.evaluations && calc.evaluations.length > 0) {
        for (const ev of calc.evaluations) {
          await Performance.query(
            `INSERT INTO performance_evaluations (
              review_id, employee_id, goal_id, kra_id, kpi_id, kra_title_snapshot,
              kra_weightage_snapshot, kpi_name_snapshot, measurement_type_snapshot,
              target_value_snapshot, actual_achievement, achievement_percentage, weighted_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              reviewId, data.employee_id, data.goal_id || null, ev.kra_id || null, ev.kpi_id || null,
              ev.kra_title_snapshot, ev.kra_weightage_snapshot, ev.kpi_name_snapshot, ev.measurement_type_snapshot,
              ev.target_value_snapshot, ev.actual_achievement, ev.achievement_percentage, ev.weighted_score
            ]
          );
        }
      }

      await Performance.commit();
      return { id: reviewId, final_score: finalScore, total_weightage: totalWeightage, overall_rating: overallRating };
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async update(id, data, userId) {
    const calc = this.calculateReviewData(data.evaluations || []);

    if (data.status === 'Completed' && !calc.isValidWeightage && data.evaluations && data.evaluations.length > 0) {
      throw new Error(`Total KRA weightage must equal 100% to finalize a review (currently ${calc.totalWeightage}%).`);
    }

    const finalScore = calc.finalScore !== undefined && data.evaluations?.length ? calc.finalScore : data.final_score;
    const totalWeightage = calc.totalWeightage !== undefined && data.evaluations?.length ? calc.totalWeightage : data.total_weightage;
    const overallRating = data.overall_rating || (data.evaluations?.length ? calc.overallRating : null);

    const sql = `
      UPDATE reviews SET
        employee_id = COALESCE(?, employee_id),
        goal_id = COALESCE(?, goal_id),
        review_period = COALESCE(?, review_period),
        reviewer_id = COALESCE(?, reviewer_id),
        type = COALESCE(?, type),
        overall_rating = COALESCE(?, overall_rating),
        final_score = COALESCE(?, final_score),
        total_weightage = COALESCE(?, total_weightage),
        strengths = ?, improvement = ?, goals = ?, comments = ?, status = COALESCE(?, status), updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.employee_id, data.goal_id || null, data.review_period, data.reviewer_id, data.type,
      overallRating, finalScore, totalWeightage,
      data.strengths !== undefined ? data.strengths : null,
      data.improvement !== undefined ? data.improvement : null,
      data.goals !== undefined ? data.goals : null,
      data.comments !== undefined ? data.comments : null,
      data.status, userId, id
    ];

    await Performance.beginTransaction();
    try {
      await Performance.query(sql, params);

      if (data.evaluations && data.evaluations.length > 0) {
        await Performance.query(`DELETE FROM performance_evaluations WHERE review_id = ?`, [id]);
        for (const ev of calc.evaluations) {
          await Performance.query(
            `INSERT INTO performance_evaluations (
              review_id, employee_id, goal_id, kra_id, kpi_id, kra_title_snapshot,
              kra_weightage_snapshot, kpi_name_snapshot, measurement_type_snapshot,
              target_value_snapshot, actual_achievement, achievement_percentage, weighted_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, data.employee_id, data.goal_id || null, ev.kra_id || null, ev.kpi_id || null,
              ev.kra_title_snapshot, ev.kra_weightage_snapshot, ev.kpi_name_snapshot, ev.measurement_type_snapshot,
              ev.target_value_snapshot, ev.actual_achievement, ev.achievement_percentage, ev.weighted_score
            ]
          );
        }
      }

      await Performance.commit();
      return true;
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async delete(id) {
    await Performance.beginTransaction();
    try {
      await Performance.query('DELETE FROM performance_evaluations WHERE review_id = ?', [id]);
      await Performance.query('DELETE FROM reviews WHERE id = ?', [id]);
      await Performance.commit();
      return true;
    } catch (e) {
      await Performance.rollback();
      throw e;
    }
  }

  static async getById(id) {
    const rows = await Performance.query(
      `SELECT r.id,
              r.employee_id,
              COALESCE(e.name, 'Employee') as employee_name,
              COALESCE(desg.role_name, 'Staff') as designation,
              COALESCE(d.dept_name, 'General') as department_name,
              r.goal_id,
              COALESCE(g.goal_title, 'General Goal') as goal_title,
              COALESCE(r.review_period, 'Q2 2026') as review_period,
              COALESCE(r.reviewer_id, 'Manager') as reviewer_id,
              COALESCE(r.type, 'Manager Review') as type,
              COALESCE(r.overall_rating, CAST(r.rating AS CHAR), '5.0') as overall_rating,
              r.final_score,
              r.total_weightage,
              r.strengths,
              r.improvement,
              r.goals,
              r.comments,
              COALESCE(r.status, 'In Progress') as status,
              r.created_at
       FROM reviews r
       LEFT JOIN employees e ON r.employee_id = e.id
       LEFT JOIN designations desg ON e.designation_id = desg.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN goals g ON r.goal_id = g.id
       WHERE r.id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) return null;
    const review = rows[0];

    const evaluations = await Performance.query(
      `SELECT * FROM performance_evaluations WHERE review_id = ? ORDER BY id ASC`,
      [id]
    );

    review.evaluations = evaluations || [];

    // Reconstruct KRA summaries for UI
    const kraMap = new Map();
    for (const ev of review.evaluations) {
      const kraTitle = ev.kra_title_snapshot || 'Key Result Area';
      if (!kraMap.has(kraTitle)) {
        kraMap.set(kraTitle, {
          kra_id: ev.kra_id,
          kra_title: kraTitle,
          kra_weightage: Number(ev.kra_weightage_snapshot) || 0,
          kpis: [],
          total_weighted_score: 0
        });
      }
      kraMap.get(kraTitle).kpis.push(ev);
      kraMap.get(kraTitle).total_weighted_score += Number(ev.weighted_score) || 0;
    }

    review.kraSummaries = Array.from(kraMap.values()).map(k => {
      const sumPct = k.kpis.reduce((acc, item) => acc + Number(item.achievement_percentage || 0), 0);
      const avgPct = k.kpis.length > 0 ? Math.round((sumPct / k.kpis.length) * 100) / 100 : 0;
      return {
        kra_id: k.kra_id,
        kra_title: k.kra_title,
        kra_weightage: k.kra_weightage,
        kra_achievement_percentage: avgPct,
        kra_weighted_score: Math.round(k.total_weighted_score * 100) / 100,
        kpi_count: k.kpis.length
      };
    });

    return review;
  }

  static async list(filters, pagination, scope = null) {
    let sql = `
      SELECT r.id,
             r.employee_id,
             e.name as employee_name,
             COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as employee_code,
             e.department_id,
             COALESCE(d.dept_name, 'General') as department_name,
             r.goal_id,
             COALESCE(g.goal_title, 'Quarterly Objectives') as goal_title,
             COALESCE(r.review_period, 'Q2 2026') as review_period,
             COALESCE(r.reviewer_id, 'Manager') as reviewer_id,
             COALESCE(r.type, 'Manager Review') as type,
             COALESCE(r.overall_rating, CAST(r.rating AS CHAR), '5.0') as overall_rating,
             r.final_score,
             r.total_weightage,
             r.strengths,
             r.improvement,
             r.goals,
             r.comments,
             COALESCE(r.status, 'In Progress') as status,
             r.created_at
      FROM reviews r
      LEFT JOIN employees e ON r.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN goals g ON r.goal_id = g.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (e.name LIKE ? OR r.reviewer_id LIKE ? OR r.status LIKE ? OR g.goal_title LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }
    if (filters.department_id) {
      sql += ` AND e.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.employee_id) {
      sql += ` AND r.employee_id = ?`;
      params.push(filters.employee_id);
    }
    if (filters.goal_id) {
      sql += ` AND r.goal_id = ?`;
      params.push(filters.goal_id);
    }

    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('r.employee_id', scope);
      sql += scopeFilter.sqlFragment;
      params.push(...scopeFilter.params);
    }

    sql += ` ORDER BY r.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await Performance.query(sql, params);

    let countSql = `
      SELECT COUNT(*) as count
      FROM reviews r
      LEFT JOIN employees e ON r.employee_id = e.id
      LEFT JOIN goals g ON r.goal_id = g.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      const term = `%${filters.search}%`;
      countSql += ` AND (e.name LIKE ? OR r.reviewer_id LIKE ? OR r.status LIKE ? OR g.goal_title LIKE ?)`;
      countParams.push(term, term, term, term);
    }
    if (filters.department_id) {
      countSql += ` AND e.department_id = ?`;
      countParams.push(filters.department_id);
    }
    if (filters.employee_id) {
      countSql += ` AND r.employee_id = ?`;
      countParams.push(filters.employee_id);
    }
    if (filters.goal_id) {
      countSql += ` AND r.goal_id = ?`;
      countParams.push(filters.goal_id);
    }
    if (scope) {
      const scopeFilter = PerformanceScopeService.getSqlFilter('r.employee_id', scope);
      countSql += scopeFilter.sqlFragment;
      countParams.push(...scopeFilter.params);
    }

    const totalRes = await Performance.query(countSql, countParams);

    return { rows, total: totalRes[0].count };
  }

  static async getEmployeePerformanceTree(employeeId, goalId = null, scope = null) {
    if (scope && !scope.isUnrestricted) {
      if (scope.scope === 'SELF' && Number(employeeId) !== Number(scope.employeeId)) {
        return []; // Block access to another employee's performance tree
      }
      if (scope.scope === 'TEAM' && (!scope.allowedEmployeeIds || !scope.allowedEmployeeIds.includes(Number(employeeId)))) {
        return []; // Block access to employee outside assigned team
      }
    }

    let goalsSql = `
      SELECT g.id, g.goal_title, g.goal_category, g.priority, g.status, g.start_date, g.target_date, g.completion_percentage,
             e.name as employee_name, e.department_id, d.dept_name as department_name
      FROM goals g
      JOIN employees e ON g.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE g.employee_id = ?
    `;
    const params = [employeeId];
    if (goalId) {
      goalsSql += ` AND g.id = ?`;
      params.push(goalId);
    }
    goalsSql += ` ORDER BY g.created_at DESC`;

    let goals = await Performance.query(goalsSql, params);

    if ((!goals || goals.length === 0) && !goalId) {
      const emp = await Performance.query(`SELECT department_id FROM employees WHERE id = ?`, [employeeId]);
      if (emp && emp.length > 0 && emp[0].department_id) {
        goals = await Performance.query(`
          SELECT g.id, g.goal_title, g.goal_category, g.priority, g.status, g.start_date, g.target_date, g.completion_percentage,
                 d.dept_name as department_name
          FROM goals g
          LEFT JOIN departments d ON g.department_id = d.id
          WHERE g.department_id = ? OR g.department_id IS NULL
          ORDER BY g.created_at DESC LIMIT 5
        `, [emp[0].department_id]);
      }
    }

    const hierarchy = [];
    for (const goal of (goals || [])) {
      const kras = await Performance.query(`
        SELECT k.id, k.kra_title, k.weightage, k.role_id, k.status
        FROM kras k
        WHERE (k.goal_id = ? OR (k.goal_id IS NULL AND (k.department_id = ? OR k.department_id IS NULL)))
          AND k.status = 'Active'
        ORDER BY k.id ASC
      `, [goal.id, goal.department_id || null]);

      for (const kra of kras) {
        const kpis = await Performance.query(`
          SELECT kp.id, kp.kpi_name, kp.measurement_type, kp.target_value, kp.status
          FROM kpis kp
          WHERE (kp.kra_id = ? OR (kp.kra_id IS NULL AND (kp.department_id = ? OR kp.department_id IS NULL)))
            AND kp.status = 'Active'
          ORDER BY kp.id ASC
        `, [kra.id, goal.department_id || null]);

        kra.kpis = kpis || [];
      }

      goal.kras = kras || [];
      hierarchy.push(goal);
    }

    return hierarchy;
  }

  static async getDashboardStats(scope = null) {
    const scopeFilter = scope ? PerformanceScopeService.getSqlFilter('employee_id', scope) : { sqlFragment: '', params: [] };

    const total = await Performance.query(`SELECT COUNT(*) as count FROM reviews WHERE 1=1 ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const completed = await Performance.query(`SELECT COUNT(*) as count FROM reviews WHERE status = 'Completed' ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const inProgress = await Performance.query(`SELECT COUNT(*) as count FROM reviews WHERE status = 'In Progress' ${scopeFilter.sqlFragment}`, scopeFilter.params);
    const pending = await Performance.query(`SELECT COUNT(*) as count FROM reviews WHERE status = 'Pending' ${scopeFilter.sqlFragment}`, scopeFilter.params);

    const totalVal = total[0].count || 0;
    const completedVal = completed[0].count || 0;
    const inProgressVal = inProgress[0].count || 0;
    const pendingVal = pending[0].count || 0;

    const rate = totalVal > 0 ? Math.round((completedVal / totalVal) * 100) : 0;

    return {
      total: totalVal,
      completed: completedVal,
      inProgress: inProgressVal,
      pending: pendingVal,
      rate: `${rate}%`,
      chartData: [
        { name: 'Completed', value: completedVal, color: '#10B981' },
        { name: 'In Progress', value: inProgressVal, color: '#2952E3' },
        { name: 'Pending', value: pendingVal, color: '#F59E0B' }
      ]
    };
  }
}

module.exports = ReviewService;
