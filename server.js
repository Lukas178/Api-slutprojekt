const express = require("express");
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
        .lock { font-size: 1rem; }
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
          <code>{ "username": "unikt namn", "first_name": "", "last_name": "" }</code>.
          <em>username</em> är obligatoriskt och måste vara unikt.
          Returnerar den skapade användaren med dess databas-id och HTTP-status 201.
        </li>
      </ul>
    </body>
    </html>
  `);
});


app.get("/users", (req, res) => {
  const sql = "SELECT * FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Databasfel", details: err.message });
    }
    res.status(200).json(results);
  });
});


app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM users WHERE id = ?";
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


app.post("/users", (req, res) => {
  const { username, first_name, last_name } = req.body;

  if (!username) {
    return res.status(400).json({ error: "username är obligatoriskt." });
  }

  const sql = "INSERT INTO users (username, first_name, last_name) VALUES (?, ?, ?)";
  db.query(sql, [username, first_name || "", last_name || ""], (err, result) => {
    if (err) {
      
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "username är redan taget." });
      }
      return res.status(500).json({ error: "Databasfel", details: err.message });
    }

   
    const newUser = {
      id: result.insertId,
      username,
      first_name: first_name || "",
      last_name: last_name || "",
    };
    res.status(201).json(newUser);
  });
});

app.listen(PORT, () => {
  console.log(`Servern körs på http://localhost:${PORT}`);
});
