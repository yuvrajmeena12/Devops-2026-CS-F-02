let students = [];

const tableBody = document.getElementById("studentTableBody");
const totalStudents = document.getElementById("totalStudents");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");

async function loadStudents() {

    try {

        const response = await fetch("/api/students");

        students = await response.json();

        totalStudents.textContent = students.length;

        renderStudents(students);

    } catch (error) {

        console.error("Unable to load students:", error);

        tableBody.innerHTML = "";

        emptyState.textContent =
            "Unable to load student records.";

        emptyState.style.display = "block";
    }
}

function renderStudents(data) {

    tableBody.innerHTML = "";

    if (data.length === 0) {

        emptyState.style.display = "block";

        return;
    }

    emptyState.style.display = "none";

    data.forEach(student => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${student.id}</td>

            <td>
                <strong>${escapeHTML(student.name)}</strong>
            </td>

            <td>${escapeHTML(student.email)}</td>

            <td>${escapeHTML(student.college)}</td>

            <td>${escapeHTML(student.course)}</td>

            <td>${escapeHTML(student.year)}</td>

            <td>
                <button
                    class="delete-btn"
                    onclick="deleteStudent(${student.id})"
                >
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

async function deleteStudent(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    try {

        const response = await fetch(`/api/students/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        loadStudents();

    } catch (error) {

        alert(error.message);
    }
}

searchInput.addEventListener("input", () => {

    const search = searchInput.value.toLowerCase();

    const filtered = students.filter(student =>
        student.name.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        student.college.toLowerCase().includes(search) ||
        student.course.toLowerCase().includes(search)
    );

    renderStudents(filtered);
});

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadStudents();