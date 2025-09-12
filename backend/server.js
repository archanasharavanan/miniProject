import express from "express";
import { Pool } from "pg";
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
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "details";

// PostgreSQL connection pool
const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ Error connecting to PostgreSQL:", err));

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

// Get user or staff by email and password
app.get("/users", async (req, res) => {
  const { email, password } = req.query;

  try {
    // Use parameterized queries to avoid SQL Injection
    const userQuery = `SELECT *, 'user' as role FROM users WHERE email = $1 AND password = $2`;
    const userResult = await pool.query(userQuery, [email, password]);

    if (userResult.rows.length > 0) {
      return res.json(userResult.rows);
    }

    const staffQuery = `SELECT *, 'staff' as role FROM staffs WHERE email = $1 AND password = $2`;
    const staffResult = await pool.query(staffQuery, [email, password]);

    if (staffResult.rows.length > 0) {
      return res.json(staffResult.rows);
    }

    return res.status(404).send("No user or staff found with these credentials");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving data");
  }
});

app.post("/assignments", upload.single("file"), async (req, res) => {
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

  try {
    // Get USN of user
    const userQuery = "SELECT usn FROM users WHERE id = $1";
    const userResult = await pool.query(userQuery, [user_id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const usn = userResult.rows[0].usn;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".pdf", ".mp4"];

    if (!allowedExtensions.includes(fileExtension)) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ error: "Only PDF and MP4 files are allowed." });
    }

    const newFileName = `${usn}.${assignment_number}${fileExtension}`;
    const newFilePath = path.join(
      ASSIGNMENTS_DIR,
      subject || "unknown",
      newFileName
    );

    fs.renameSync(file.path, newFilePath);

    const insertQuery = `
      INSERT INTO assignments 
      (user_id, subject, title, description, category, assignment_number, file)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `;

    const insertResult = await pool.query(insertQuery, [
      user_id,
      subject,
      title,
      description,
      category,
      assignment_number,
      newFileName,
    ]);

    res.status(200).json({
      id: insertResult.rows[0].id,
      subject,
      title,
      description,
      category,
      assignment_number,
      file: newFileName,
      filePath: `/uploads/${subject}/${newFileName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error inserting assignment");
  }
});

app.get("/assignments", async (req, res) => {
  const { subject, year, assignmentNumber } = req.query;

  const query = `
    SELECT a.id, u.usn, u.name, a.category, a.title, a.description, a.file, a.assignment_number
    FROM assignments a
    INNER JOIN users u ON a.user_id = u.id
    WHERE a.subject = $1 AND u.batch = $2 AND a.assignment_number = $3
  `;

  try {
    const results = await pool.query(query, [subject, year, assignmentNumber]);
    res.json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching assignments");
  }
});

app.get("/assignments/:userId", async (req, res) => {
  const userId = req.params.userId;
  const query = "SELECT * FROM assignments WHERE user_id = $1";

  try {
    const results = await pool.query(query, [userId]);
    res.json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving assignments");
  }
});

app.delete("/assignments/:id", async (req, res) => {
  const assignmentId = req.params.id;
  const getAssignmentQuery = "SELECT * FROM assignments WHERE id = $1";

  try {
    const results = await pool.query(getAssignmentQuery, [assignmentId]);

    if (results.rows.length === 0) {
      return res.status(404).send("Assignment not found");
    }

    const assignment = results.rows[0];
    const filePath = path.join(ASSIGNMENTS_DIR, assignment.subject, assignment.file);

    fs.unlink(filePath, async (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== "ENOENT") {
        return res.status(500).send("Error deleting file");
      }

      const deleteQuery = "DELETE FROM assignments WHERE id = $1";
      try {
        await pool.query(deleteQuery, [assignmentId]);
        res.status(200).send({ message: "Assignment deleted successfully" });
      } catch (deleteErr) {
        res.status(500).send("Error deleting from database");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving assignment");
  }
});

app.get("/subjects", async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Staff name is required" });

  const query = "SELECT subjects FROM staffs WHERE name = $1";

  try {
    const results = await pool.query(query, [name]);

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "No subjects found" });
    }

    const subjects = results.rows[0].subjects.split(",");
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
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
