exports.up = async function(knex) {
  // Use raw SQL with IF NOT EXISTS - bulletproof regardless of Knex version
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`client_visits\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`employee_id\` int unsigned NOT NULL,
      \`client_name\` varchar(255) NOT NULL,
      \`date\` date NOT NULL,
      \`start_journey_time\` datetime NULL,
      \`check_in_time\` datetime NULL,
      \`check_in_lat\` decimal(10,8) NULL,
      \`check_in_lng\` decimal(11,8) NULL,
      \`photo_in_url\` varchar(500) NULL,
      \`check_out_time\` datetime NULL,
      \`check_out_lat\` decimal(10,8) NULL,
      \`check_out_lng\` decimal(11,8) NULL,
      \`photo_out_url\` varchar(500) NULL,
      \`end_journey_time\` datetime NULL,
      \`office_lat\` decimal(10,8) NULL,
      \`office_lng\` decimal(11,8) NULL,
      \`client_address\` varchar(500) NULL,
      \`distance_travelled\` decimal(10,2) DEFAULT '0',
      \`calculated_fee\` decimal(10,2) DEFAULT '0',
      \`status\` enum('Travelling','In Meeting','Returning','Completed') DEFAULT 'Travelling',
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Add visit_id to LocationHistory if not already there
  const hasVisitId = await knex.schema.hasColumn('LocationHistory', 'visit_id');
  if (!hasVisitId) {
    await knex.schema.alterTable('LocationHistory', function(table) {
      table.integer('visit_id').unsigned().nullable();
    });
  }

  // Ensure new columns exist (safe for already-created tables)
  const hasStartJourney = await knex.schema.hasColumn('client_visits', 'start_journey_time');
  if (!hasStartJourney) {
    await knex.raw('ALTER TABLE `client_visits` ADD COLUMN `start_journey_time` datetime NULL');
  }
  const hasEndJourney = await knex.schema.hasColumn('client_visits', 'end_journey_time');
  if (!hasEndJourney) {
    await knex.raw('ALTER TABLE `client_visits` ADD COLUMN `end_journey_time` datetime NULL');
  }
  const hasOfficeLat = await knex.schema.hasColumn('client_visits', 'office_lat');
  if (!hasOfficeLat) {
    await knex.raw('ALTER TABLE `client_visits` ADD COLUMN `office_lat` decimal(10,8) NULL, ADD COLUMN `office_lng` decimal(11,8) NULL, ADD COLUMN `client_address` varchar(500) NULL');
  }
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('client_visits');
};
