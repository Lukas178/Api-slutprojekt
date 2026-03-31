const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",       
  password: "",      
  database: "api_db",
});

db.connect((err) => {
  if (err) {
    console.error("Kunde inte ansluta till databasen:", err.message);
    process.exit(1);
  }
  console.log("Ansluten till MySQL-databasen!");
});

module.exports = db;
