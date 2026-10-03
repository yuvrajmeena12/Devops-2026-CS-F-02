const form = document.getElementById("registrationForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const student = Object.fromEntries(formData.entries());

    message.textContent = "Registering student...";
    message.className = "message";

    try {
        const response = await fetch("/api/students", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(student)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        message.textContent =
            "Registration successful! Redirecting to dashboard...";

        message.className = "message success";

        form.reset();

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1200);

    } catch (error) {

        message.textContent = error.message;
        message.className = "message error";
    }
});