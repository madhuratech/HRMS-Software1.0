/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('requirements');
  if (hasTable) {
    const columnsToAdd = [
      { name: 'remarks', add: (t) => t.text('remarks').nullable() },
      { name: 'attachment', add: (t) => t.string('attachment', 500).nullable() },
      { name: 'company_id', add: (t) => t.integer('company_id').nullable() },
      { name: 'branch_id', add: (t) => t.integer('branch_id').nullable() },
      { name: 'created_by', add: (t) => t.integer('created_by').nullable() },
      { name: 'updated_by', add: (t) => t.integer('updated_by').nullable() },
      { name: 'deleted_by', add: (t) => t.integer('deleted_by').nullable() },
      { name: 'deleted_at', add: (t) => t.timestamp('deleted_at').nullable() },
      { name: 'approval_status', add: (t) => t.enum('approval_status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending') }
    ];

    for (const col of columnsToAdd) {
      const hasColumn = await knex.schema.hasColumn('requirements', col.name);
      if (!hasColumn) {
        await knex.schema.alterTable('requirements', (table) => {
          col.add(table);
        });
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Not rolling back to avoid accidental data loss
};
