async function loadStudentCount() {

    try {

        const response = await fetch("/api/students");

        const students = await response.json();

        document.getElementById("studentCount").textContent =
            students.length;

    } catch (error) {

        console.error("Unable to load student count");
    }
}

loadStudentCount();