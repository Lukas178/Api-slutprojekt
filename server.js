const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");
 
const app = express();
app.use(express.json()); 
 
const PORT = 5000;
 
 
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="sv">
    <head>
      <meta charset="UTF-8" />
      <title>API Dokumentation</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        h1 { font-size: 2rem; }
        h2 { margin-top: 30px; }
        ul { line-height: 2; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>Dokumentation av det här APIet</h1>
 
      <h2>Routes</h2>
      <ul>
        <li>
          <strong>GET /users</strong> – Returnerar en lista med alla användare i databasen.
        </li>
        <li>
          <strong>GET /users/:id</strong> – Returnerar en enskild användare med angivet id.
          Returnerar status 204 om användaren inte finns.
        </li>
        <li>
          <strong>POST /users</strong> – Skapar en ny användare. Accepterar ett JSON-objekt på formatet:
          <code>{ "username": "unikt namn", "first_name": "", "last_name": "", "password": "" }</code>.
          <em>username</em> och <em>password</em> är obligatoriska. Returnerar den skapade användaren med status 201.
        </li>
        <li>
          <strong>PUT /users/:id</strong> – Uppdaterar en användare med angivet id. Accepterar:
          <code>{ "username": "" }</code>.
          Returnerar den uppdaterade användaren med status 200.
        </li>
        <li>
          <strong>POST /login</strong> – Loggar in en användare. Accepterar:
          <code>{ "username": "", "password": "" }</code>.
          Returnerar användarinfo utan lösenord vid lyckad inloggning med status 200.
          Returnerar status 401 vid misslyckad inloggning.
        </li>
      </ul>
    </body>
    </html>
  `);
});
 
 
app.get("/users", (req, res) => {
  const sql = "SELECT id, username, first_name, last_name FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Databasfel", details: err.message });
    }
    res.status(200).json(results);
  });
});
 
 
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT id, username, first_name, last_name FROM users WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Databasfel", details: err.message });
    }
    if (results.length === 0) {
      return res.status(204).send(); 
    }
    res.status(200).json(results[0]);
  });
});
 
 
app.post("/users", async (req, res) => {
  const { username, first_name, last_name, password } = req.body;
 
  if (!username || !password) {
    return res.status(400).json({ error: "username och password är obligatoriska." });
  }
 
  const hashedPassword = await bcrypt.hash(password, 10);
 
  const sql = "INSERT INTO users (username, first_name, last_name, password) VALUES (?, ?, ?, ?)";
  db.query(sql, [username, first_name || "", last_name || "", hashedPassword], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "username är redan taget." });
      }
      return res.status(500).json({ error: "Databasfel", details: err.message });
    }
 
    res.status(201).json({
      id: result.insertId,
      username,
      first_name: first_name || "",
      last_name: last_name || "",
    });
  });
});
 
 
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
 
  if (!username) {
    return res.status(400).json({ error: "username är obligatoriskt." });
  }
 
  db.query("SELECT id FROM users WHERE id = ?", [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Databasfel", details: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Användaren hittades inte." });
    }
 
    db.query("UPDATE users SET username = ? WHERE id = ?", [username, id], (err2) => {
      if (err2) {
        if (err2.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "username är redan taget." });
        }
        return res.status(500).json({ error: "Databasfel", details: err2.message });
      }
 
      res.status(200).json({
        id: parseInt(id),
        username,
      });
    });
  });
});
 
 
app.post("/login", (req, res) => {
  const { username, password } = req.body;
 
  if (!username || !password) {
    return res.status(400).json({ error: "username och password är obligatoriska." });
  }
 
  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Databasfel", details: err.message });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: "Fel användarnamn eller lösenord." });
    }
 
    const user = results[0];
    const stämmer = await bcrypt.compare(password, user.password);
 
    if (!stämmer) {
      return res.status(401).json({ error: "Fel användarnamn eller lösenord." });
    }
 
    res.status(200).json({
      message: "Inloggning lyckades",
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      }
    });
  });
});
 
 
app.listen(PORT, () => {
  console.log(`Servern körs på http://localhost:${PORT}`);
});