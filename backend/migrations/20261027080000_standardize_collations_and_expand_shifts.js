/**
 * Knex migration: standardize table collations to utf8mb4_general_ci and expand shifts table columns
 */
exports.up = async function (knex) {
  // 1. Standardize collation to prevent ER_CANT_AGGREGATE_2COLLATIONS
  const tablesToConvert = [
    'teams',
    'candidate_experiences',
    'employee_previous_experiences',
    'helpdesk_articles',
    'helpdesk_categories',
    'helpdesk_priorities',
    'helpdesk_tickets'
  ];

  for (const tbl of tablesToConvert) {
    const hasTbl = await knex.schema.hasTable(tbl);
    if (hasTbl) {
      try {
        await knex.raw(`ALTER TABLE \`${tbl}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
      } catch (err) {
        console.warn(`Could not convert collation for ${tbl}:`, err.message);
      }
    }
  }

  // 2. Expand shifts table
  const hasShifts = await knex.schema.hasTable('shifts');
  if (hasShifts) {
    const checkAndAddCol = async (colName, callback) => {
      const hasCol = await knex.schema.hasColumn('shifts', colName);
      if (!hasCol) {
        await knex.schema.alterTable('shifts', callback);
      }
    };

    await checkAndAddCol('name', t => t.string('name', 150).nullable().defaultTo(''));
    await checkAndAddCol('code', t => t.string('code', 50).nullable().defaultTo(''));
    await checkAndAddCol('startTime', t => t.string('startTime', 50).nullable().defaultTo('09:00 AM'));
    await checkAndAddCol('endTime', t => t.string('endTime', 50).nullable().defaultTo('06:00 PM'));
    await checkAndAddCol('breakTime', t => t.string('breakTime', 50).nullable().defaultTo('60 mins'));
    await checkAndAddCol('graceTime', t => t.string('graceTime', 50).nullable().defaultTo('15 mins'));
    await checkAndAddCol('workingHours', t => t.string('workingHours', 50).nullable().defaultTo('9 hours'));
    await checkAndAddCol('employees', t => t.integer('employees').defaultTo(0));
    await checkAndAddCol('assignedEmployees', t => t.json('assignedEmployees').nullable());
    await checkAndAddCol('workingDays', t => t.json('workingDays').nullable());
    await checkAndAddCol('offLabel', t => t.string('offLabel', 50).nullable().defaultTo('Weekly Off'));
    await checkAndAddCol('dayOffLabels', t => t.json('dayOffLabels').nullable());
    await checkAndAddCol('description', t => t.text('description').nullable());
    await checkAndAddCol('createdDate', t => t.string('createdDate', 50).nullable());

    try {
      await knex.raw(`
        UPDATE shifts 
        SET name = COALESCE(NULLIF(name, ''), shift_name),
            startTime = COALESCE(NULLIF(startTime, ''), TIME_FORMAT(start_time, '%h:%i %p'), '09:00 AM'),
            endTime = COALESCE(NULLIF(endTime, ''), TIME_FORMAT(end_time, '%h:%i %p'), '06:00 PM')
      `);
    } catch (e) {}
  }
};

exports.down = async function (knex) {
  // Safe rollback
};
