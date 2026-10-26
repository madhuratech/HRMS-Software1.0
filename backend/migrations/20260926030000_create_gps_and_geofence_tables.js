/**
 * Migration: Create GPS Attendance and Geofence Locations Tables
 * 
 * Ensures GeofenceLocations, GPSAttendance, AttendanceLogs exist and
 * aligns LocationHistory columns (adding recorded_at).
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. GeofenceLocations
  if (!(await knex.schema.hasTable('GeofenceLocations'))) {
    await knex.schema.createTable('GeofenceLocations', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('branch', 255).nullable();
      table.decimal('latitude', 10, 8).notNullable();
      table.decimal('longitude', 11, 8).notNullable();
      table.integer('radius').notNullable();
      table.text('address').nullable();
      table.text('description').nullable();
      table.string('status', 20).defaultTo('Active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
    console.log('✅ Created GeofenceLocations table.');

    // Seed default Geofence locations
    await knex('GeofenceLocations').insert([
      { name: 'Main Headquarters', branch: 'HQ', latitude: 12.9718, longitude: 77.5945, radius: 100, address: 'MG Road, Bangalore', description: 'Primary corporate office', status: 'Active' },
      { name: 'Branch Office - Downtown', branch: 'Downtown', latitude: 12.9730, longitude: 77.6190, radius: 150, address: 'Indiranagar, Bangalore', description: 'Engineering center', status: 'Active' },
      { name: 'Remote Office - Tech Hub', branch: 'Tech Hub', latitude: 12.9302, longitude: 77.5315, radius: 200, address: 'Jayanagar, Bangalore', description: 'Support office', status: 'Active' },
      { name: 'Client Site - Retail Center', branch: 'Retail', latitude: 13.0010, longitude: 77.5725, radius: 250, address: 'Malleshwaram, Bangalore', description: 'Retail division', status: 'Active' }
    ]);
    console.log('✅ Seeded default GeofenceLocations.');
  }

  // 2. GPSAttendance
  if (!(await knex.schema.hasTable('GPSAttendance'))) {
    await knex.schema.createTable('GPSAttendance', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().notNullable();
      table.date('punch_date').notNullable();
      table.timestamp('check_in_time').nullable();
      table.timestamp('check_out_time').nullable();
      table.decimal('latitude_in', 10, 8).nullable();
      table.decimal('longitude_in', 11, 8).nullable();
      table.decimal('latitude_out', 10, 8).nullable();
      table.decimal('longitude_out', 11, 8).nullable();
      table.string('punch_in_location', 255).nullable();
      table.string('punch_out_location', 255).nullable();
      table.string('working_hours', 50).nullable();
      table.string('status', 50).nullable();
      table.boolean('early_exit').defaultTo(false);
      table.boolean('late_entry').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

      table.foreign('employee_id').references('id').inTable('employees').onDelete('CASCADE');
      table.unique(['employee_id', 'punch_date'], 'unique_employee_date');
    });
    console.log('✅ Created GPSAttendance table.');
  }

  // 3. AttendanceLogs
  if (!(await knex.schema.hasTable('AttendanceLogs'))) {
    await knex.schema.createTable('AttendanceLogs', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().notNullable();
      table.string('punch_type', 10).notNullable();
      table.timestamp('punch_time').defaultTo(knex.fn.now());
      table.decimal('latitude', 10, 8).nullable();
      table.decimal('longitude', 11, 8).nullable();
      table.string('location_name', 255).nullable();
      table.decimal('distance', 10, 2).nullable();
      table.string('inside_radius', 10).nullable();
      table.string('device_info', 255).nullable();
      table.string('browser', 255).nullable();
      table.string('ip_address', 45).nullable();
      table.string('status', 20).defaultTo('Success');
      table.text('failure_reason').nullable();

      table.foreign('employee_id').references('id').inTable('employees').onDelete('CASCADE');
    });
    console.log('✅ Created AttendanceLogs table.');
  }

  // 4. LocationHistory (ensure recorded_at column exists)
  if (await knex.schema.hasTable('LocationHistory')) {
    const hasRecordedAt = await knex.schema.hasColumn('LocationHistory', 'recorded_at');
    if (!hasRecordedAt) {
      await knex.schema.alterTable('LocationHistory', (table) => {
        table.timestamp('recorded_at').defaultTo(knex.fn.now());
      });
      // Sync from timestamp if timestamp has values
      const hasTimestamp = await knex.schema.hasColumn('LocationHistory', 'timestamp');
      if (hasTimestamp) {
        await knex.raw('UPDATE LocationHistory SET recorded_at = `timestamp` WHERE recorded_at IS NULL AND `timestamp` IS NOT NULL');
      }
      console.log('✅ Added recorded_at to LocationHistory table.');
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Defensive down
};
