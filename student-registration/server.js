const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_FILE = path.join(__dirname, "data", "students.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

function readStudents() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, "[]");
        }

        const data = fs.readFileSync(DATA_FILE, "utf8");
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading students:", error);
        return [];
    }
}

function saveStudents(students) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(students, null, 2)
    );
}

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Student Registration Server is running"
    });
});

// Get all students
app.get("/api/students", (req, res) => {
    const students = readStudents();
    res.json(students);
});

// Register a student
app.post("/api/students", (req, res) => {
    const {
        name,
        email,
        phone,
        dob,
        gender,
        college,
        course,
        year,
        rollNumber,
        address
    } = req.body;

    if (
        !name ||
        !email ||
        !phone ||
        !dob ||
        !gender ||
        !college ||
        !course ||
        !year ||
        !rollNumber ||
        !address
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const students = readStudents();

    const emailExists = students.some(
        student => student.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
        return res.status(409).json({
            success: false,
            message: "A student with this email already exists"
        });
    }

    const newStudent = {
        id: students.length
            ? Math.max(...students.map(student => student.id)) + 1
            : 1,
        name,
        email,
        phone,
        dob,
        gender,
        college,
        course,
        year,
        rollNumber,
        address,
        registeredAt: new Date().toISOString()
    };

    students.push(newStudent);
    saveStudents(students);

    res.status(201).json({
        success: true,
        message: "Student registered successfully",
        student: newStudent
    });
});

// Delete student
app.delete("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);

    const students = readStudents();

    const updatedStudents = students.filter(
        student => student.id !== id
    );

    if (students.length === updatedStudents.length) {
        return res.status(404).json({
            success: false,
            message: "Student not found"
        });
    }

    saveStudents(updatedStudents);

    res.json({
        success: true,
        message: "Student deleted successfully"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Student Registration Server running on port ${PORT}`);
});