/**
 * Migration: Add read_at column to notifications table if missing
 */
exports.up = async function(knex) {
  const hasNotifications = await knex.schema.hasTable('notifications');
  if (hasNotifications) {
    const hasReadAt = await knex.schema.hasColumn('notifications', 'read_at');
    if (!hasReadAt) {
      await knex.schema.alterTable('notifications', (table) => {
        table.timestamp('read_at').nullable().after('is_read');
      });
      console.log('✅ Added read_at column to notifications table.');
    }
  }
};

exports.down = async function(knex) {
  const hasNotifications = await knex.schema.hasTable('notifications');
  if (hasNotifications) {
    const hasReadAt = await knex.schema.hasColumn('notifications', 'read_at');
    if (hasReadAt) {
      await knex.schema.alterTable('notifications', (table) => {
        table.dropColumn('read_at');
      });
    }
  }
};
