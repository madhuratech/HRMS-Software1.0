const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function syncPhotos() {
  console.log('🔄 Checking existing employee profile photos for persistent storage...');
  
  db.query("SELECT id, name, profile_photo FROM employees WHERE profile_photo IS NOT NULL", (err, rows) => {
    if (err) {
      console.error('Error fetching employees:', err);
      process.exit(1);
    }

    let updatedCount = 0;
    let skippedCount = 0;

    const promises = rows.map((emp) => {
      return new Promise((resolve) => {
        const photo = emp.profile_photo;
        if (!photo || photo.startsWith('data:') || photo.startsWith('http://') || photo.startsWith('https://')) {
          skippedCount++;
          return resolve();
        }

        // Relative path, check if exists in local uploads directory
        const normalizedPath = photo.replace(/^\//, '');
        const fullDiskPath = path.join(__dirname, '..', normalizedPath);

        if (fs.existsSync(fullDiskPath)) {
          try {
            const buf = fs.readFileSync(fullDiskPath);
            const ext = path.extname(fullDiskPath).toLowerCase();
            const mime = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');
            const dataUri = `data:${mime};base64,${buf.toString('base64')}`;

            db.query("UPDATE employees SET profile_photo = ? WHERE id = ?", [dataUri, emp.id], (upErr) => {
              if (upErr) {
                console.error(`Failed to update employee #${emp.id}:`, upErr.message);
              } else {
                console.log(`✅ Converted photo for Employee #${emp.id} (${emp.name}) to persistent database Data URI.`);
                updatedCount++;
              }
              resolve();
            });
          } catch (e) {
            console.error(`Error reading file for #${emp.id}:`, e.message);
            resolve();
          }
        } else {
          console.log(`ℹ️ File not found on local disk for Employee #${emp.id} (${photo}), keeping as is.`);
          resolve();
        }
      });
    });

    Promise.all(promises).then(() => {
      console.log(`\n🎉 Synchronization finished: ${updatedCount} photo(s) persisted, ${skippedCount} already persistent/skipped.`);
      process.exit(0);
    });
  });
}

syncPhotos();
