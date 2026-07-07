const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function seedAdmin() {
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO admins (username, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [username, hash],
  );

  console.log(
    `Admin ready -> username: "${username}", password: "${password}"`,
  );
  console.log("Change this password after first login in a real deployment.");
}

if (require.main === module) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Failed to seed admin:", err);
      process.exit(1);
    });
}

module.exports = { seedAdmin };
