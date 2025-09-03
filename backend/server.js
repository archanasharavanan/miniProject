import express from "express";
import mysql from "mysql";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "555851",
  database: "details",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL");
});

// Ensure 'assignments' directory exists
if (!fs.existsSync("assignments")) {
  fs.mkdirSync("assignments");
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { subject } = req.body;
    const subjectPath = path.join("assignments", subject);

    // Ensure the subject directory exists
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

// Test API route
app.get("/test", (req, res) => {
  res.send("Test route working");
});

// User and staff login route
app.get("/users", (req, res) => {
  const { email, password } = req.query;

  const userQuery =
    'SELECT *, "user" as role FROM users WHERE email = ? AND password = ?';
  const staffQuery =
    'SELECT *, "staff" as role FROM staffs WHERE email = ? AND password = ?';

  connection.query(userQuery, [email, password], (err, userResults) => {
    if (err) {
      console.error("Error retrieving user data:", err);
      return res.status(500).send("Error retrieving user data");
    }

    if (userResults.length > 0) {
      return res.json(userResults);
    }

    connection.query(staffQuery, [email, password], (err, staffResults) => {
      if (err) {
        console.error("Error retrieving staff data:", err);
        return res.status(500).send("Error retrieving staff data");
      }

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

// Upload assignments
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

  if (!file) {
    return res.status(400).json({ error: "File upload is required" });
  }

  const userQuery = "SELECT usn FROM users WHERE id = ?";
  connection.query(userQuery, [user_id], (err, userResults) => {
    if (err) {
      console.error("Error fetching user USN:", err);
      return res.status(500).send("Error retrieving user data");
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const usn = userResults[0].usn;

    let fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".pdf", ".mp4"];

    if (!allowedExtensions.includes(fileExtension)) {
      return res
        .status(400)
        .json({ error: "Invalid file type. Only PDF and MP4 are allowed." });
    }

    const newFileName = `${usn}.${assignment_number}${fileExtension}`;
    const newFilePath = path.join("assignments", subject, newFileName);

    fs.rename(file.path, newFilePath, (renameErr) => {
      if (renameErr) {
        console.error("Error renaming file:", renameErr);
        return res.status(500).send("Error renaming file");
      }

      const insertQuery = `INSERT INTO assignments (user_id, subject, title, description, category, assignment_number, file)
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
          if (insertErr) {
            console.error("Error inserting assignment:", insertErr);
            return res.status(500).send("Error inserting assignment");
          }

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

// Staff assignments
app.get("/assignments", (req, res) => {
  const { subject, year, assignmentNumber } = req.query;

  const query = `
        SELECT a.id, u.usn, u.name, a.category, a.title, a.description, a.file, a.assignment_number
        FROM assignments AS a
        INNER JOIN users AS u ON a.user_id = u.id
        WHERE a.subject = ? AND u.batch = ? AND a.assignment_number = ?
    `;

  connection.query(query, [subject, year, assignmentNumber], (err, results) => {
    if (err) {
      console.error("Error fetching assignments:", err);
      return res.status(500).send("Error fetching assignments");
    }
    res.json(results);
  });
});

// Retrieve assignments for a specific user
app.get("/assignments/:userId", (req, res) => {
  const userId = req.params.userId;

  const query = "SELECT * FROM assignments WHERE user_id = ?";
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching assignments:", err);
      return res.status(500).send("Error retrieving assignments");
    }
    res.json(results);
  });
});

// Delete assignment
app.delete("/assignments/:id", (req, res) => {
  const assignmentId = req.params.id;

  const getAssignmentQuery = "SELECT * FROM assignments WHERE id = ?";
  connection.query(getAssignmentQuery, [assignmentId], (err, results) => {
    if (err) {
      console.error("Error fetching assignment details:", err);
      return res.status(500).send("Error retrieving assignment");
    }

    if (results.length === 0) {
      return res.status(404).send("Assignment not found");
    }

    const assignment = results[0];
    const filePath = path.join(
      __dirname,
      "assignments",
      assignment.subject,
      assignment.file
    );

    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== "ENOENT") {
        console.error("Error deleting file:", unlinkErr);
        return res.status(500).send("Error deleting file");
      }

      const deleteAssignmentQuery = "DELETE FROM assignments WHERE id = ?";
      connection.query(deleteAssignmentQuery, [assignmentId], (deleteErr) => {
        if (deleteErr) {
          console.error("Error deleting assignment from database:", deleteErr);
          return res
            .status(500)
            .send("Error deleting assignment from database");
        }

        res.status(200).send({ message: "Assignment deleted successfully" });
      });
    });
  });
});

// Staff subjects
app.get("/subjects", (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: "Staff name is required" });
  }

  const query = "SELECT subjects FROM staffs WHERE name = ?";
  connection.query(query, [name], (err, results) => {
    if (err) {
      console.error("Error fetching subjects:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No subjects found for this staff" });
    }

    const subjects = results[0].subjects.split(",");
    res.json(subjects);
  });
});

app.use("/uploads", express.static(path.join(__dirname, "assignments")));

app.listen(5000, "0,0,0,0",() => {
  console.log("Server running on port 5000");
});
