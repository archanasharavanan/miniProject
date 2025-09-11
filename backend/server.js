import express from "express";
import mysql from "mysql";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load .env variables
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS and JSON
app.use(cors({ origin: 'https://mini-project-alpha-puce.vercel.app' }));

app.use(express.json());

// ENV vars
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "details";

// Log for debug
console.log(`Connecting to MySQL at ${DB_HOST}:${DB_PORT}`);

// MySQL Connection
const connection = mysql.createConnection({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
    return;
  }
  console.log("✅ Connected to MySQL");
});

// Assignments Directory
const ASSIGNMENTS_DIR = path.join(__dirname, "assignments");
if (!fs.existsSync(ASSIGNMENTS_DIR)) {
  fs.mkdirSync(ASSIGNMENTS_DIR, { recursive: true });
}

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { subject } = req.body;
    const subjectPath = path.join(ASSIGNMENTS_DIR, subject || "unknown");

    if (!fs.existsSync(subjectPath)) {
      fs.mkdirSync(subjectPath, { recursive: true });
    }

    cb(null, subjectPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Routes

app.get("/test", (_req, res) => {
  res.json({ ok: true });
});

app.get("/users", (req, res) => {
  const { email, password } = req.query;

  const userQuery =
    'SELECT *, "user" as role FROM users WHERE email = ? AND password = ?';
  const staffQuery =
    'SELECT *, "staff" as role FROM staffs WHERE email = ? AND password = ?';

  connection.query(userQuery, [email, password], (err, userResults) => {
    if (err) return res.status(500).send("Error retrieving user data");

    if (userResults.length > 0) {
      return res.json(userResults);
    }

    connection.query(staffQuery, [email, password], (err, staffResults) => {
      if (err) return res.status(500).send("Error retrieving staff data");

      if (staffResults.length > 0) {
        return res.json(staffResults);
      } else {
        return res
          .status(404)
          .send("No user or staff found with these credentials");
      }
    });
  });
});

app.post("/assignments", upload.single("file"), (req, res) => {
  const {
    user_id,
    subject,
    title,
    description,
    category,
    assignment_number,
  } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "File upload is required" });

  const userQuery = "SELECT usn FROM users WHERE id = ?";
  connection.query(userQuery, [user_id], (err, userResults) => {
    if (err) return res.status(500).send("Error retrieving user data");

    if (userResults.length === 0)
      return res.status(404).json({ error: "User not found" });

    const usn = userResults[0].usn;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".pdf", ".mp4"];

    if (!allowedExtensions.includes(fileExtension)) {
      fs.unlink(file.path, () => {});
      return res
        .status(400)
        .json({ error: "Only PDF and MP4 files are allowed." });
    }

    const newFileName = `${usn}.${assignment_number}${fileExtension}`;
    const newFilePath = path.join(
      ASSIGNMENTS_DIR,
      subject || "unknown",
      newFileName
    );

    fs.rename(file.path, newFilePath, (renameErr) => {
      if (renameErr) return res.status(500).send("Error renaming file");

      const insertQuery = `INSERT INTO assignments 
        (user_id, subject, title, description, category, assignment_number, file)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

      connection.query(
        insertQuery,
        [
          user_id,
          subject,
          title,
          description,
          category,
          assignment_number,
          newFileName,
        ],
        (insertErr, results) => {
          if (insertErr)
            return res.status(500).send("Error inserting assignment");

          res.status(200).json({
            id: results.insertId,
            subject,
            title,
            description,
            category,
            assignment_number,
            file: newFileName,
            filePath: `/uploads/${subject}/${newFileName}`,
          });
        }
      );
    });
  });
});

app.get("/assignments", (req, res) => {
  const { subject, year, assignmentNumber } = req.query;

  const query = `
    SELECT a.id, u.usn, u.name, a.category, a.title, a.description, a.file, a.assignment_number
    FROM assignments AS a
    INNER JOIN users AS u ON a.user_id = u.id
    WHERE a.subject = ? AND u.batch = ? AND a.assignment_number = ?
  `;

  connection.query(query, [subject, year, assignmentNumber], (err, results) => {
    if (err) return res.status(500).send("Error fetching assignments");
    res.json(results);
  });
});

app.get("/assignments/:userId", (req, res) => {
  const userId = req.params.userId;
  const query = "SELECT * FROM assignments WHERE user_id = ?";

  connection.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send("Error retrieving assignments");
    res.json(results);
  });
});

app.delete("/assignments/:id", (req, res) => {
  const assignmentId = req.params.id;
  const getAssignmentQuery = "SELECT * FROM assignments WHERE id = ?";

  connection.query(getAssignmentQuery, [assignmentId], (err, results) => {
    if (err) return res.status(500).send("Error retrieving assignment");

    if (results.length === 0) return res.status(404).send("Assignment not found");

    const assignment = results[0];
    const filePath = path.join(
      ASSIGNMENTS_DIR,
      assignment.subject,
      assignment.file
    );

    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== "ENOENT") {
        return res.status(500).send("Error deleting file");
      }

      const deleteQuery = "DELETE FROM assignments WHERE id = ?";
      connection.query(deleteQuery, [assignmentId], (deleteErr) => {
        if (deleteErr)
          return res.status(500).send("Error deleting from database");

        res.status(200).send({ message: "Assignment deleted successfully" });
      });
    });
  });
});

app.get("/subjects", (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Staff name is required" });

  const query = "SELECT subjects FROM staffs WHERE name = ?";
  connection.query(query, [name], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length === 0)
      return res.status(404).json({ error: "No subjects found" });

    const subjects = results[0].subjects.split(",");
    res.json(subjects);
  });
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(ASSIGNMENTS_DIR)));

// Serve React frontend in production
const clientBuildPath = path.join(__dirname, "..", "frontend", "build");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/assignments") ||
      req.path.startsWith("/users") ||
      req.path.startsWith("/subjects") ||
      req.path.startsWith("/test")
    ) {
      return res.status(404).end();
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
