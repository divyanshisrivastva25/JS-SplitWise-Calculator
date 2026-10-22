const form = document.getElementById("expenseForm");
const personCount = document.getElementById("personCount");
const nameFields = document.getElementById("nameFields");
const resultSection = document.getElementById("resultSection");
const results = document.getElementById("results");
const historyDiv = document.getElementById("history");

let currentExpense = null;

// Load saved expenses
let expenses = JSON.parse(
    localStorage.getItem("splitwiseExpenses") || "[]"
);

// Load saved theme
if (localStorage.getItem("splitwiseTheme") === "dark") {
    document.body.classList.add("dark");
}

updateThemeButton();
renderHistory();

// Generate person name inputs
function generateNameFields() {
    const count = Number(personCount.value);

    if (!Number.isInteger(count) || count < 1 || count > 50) {
        nameFields.innerHTML = "";
        return;
    }

    const oldNames = [...nameFields.querySelectorAll("input")
    ].map(input => input.value);

    nameFields.innerHTML = "";

    for (let i = 0; i < count; i++) {
        const label = document.createElement("label");
        label.textContent = `Person ${i + 1} Name`;

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = `Person ${i + 1}`;
        input.value = oldNames[i] || `Person ${i + 1}`;
        input.setAttribute("aria-label", `Person ${i + 1} name`);
        input.required = true;
        input.maxLength = 60;

        nameFields.appendChild(input);
    }
}

personCount.addEventListener("input", generateNameFields);
generateNameFields();

// Calculate the split
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = document.getElementById("expenseTitle").value.trim();

    const amount = Number( document.getElementById("totalAmount").value);

    const inputs = [...nameFields.querySelectorAll("input")];

    const names = inputs.map(input => input.value.trim());

    if (
        !title ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !Number.isSafeInteger(Math.round(amount * 100)) ||
        names.length !== Number(personCount.value) ||
        names.some(name => !name)
    ) {
        alert("Please enter valid expense details and names.");
        return;
    }

    const uniqueNames = names.map(name => name.toLowerCase());

    if (new Set(uniqueNames).size !== uniqueNames.length) {
        alert("Please enter a different name for each person.");
        return;
    }

    // Convert to paise to avoid rounding errors
    const totalPaise = Math.round(amount * 100);
    const baseShare = Math.floor(totalPaise / names.length);
    const remainder = totalPaise % names.length;

    const shares = names.map((name, index) => ({
        name,
        amount: ( baseShare + (index < remainder ? 1 : 0)) / 100
    }));

    currentExpense = {
        id: Date.now() + Math.random(),
        title,
        total: totalPaise / 100,
        people: shares,
        date: new Date().toISOString()
    };

    document.getElementById("expenseSummary").textContent = `${title} — Total: ${formatMoney(currentExpense.total)}`;

    results.innerHTML = "";

    shares.forEach(person => {
        const row = document.createElement("div");
        row.className = "result-row";

        const name = document.createElement("span");
        name.textContent = person.name;

        const share = document.createElement("span");
        share.className = "amount";
        share.textContent = formatMoney(person.amount);

        row.append(name, share);
        results.appendChild(row);
    });

    resultSection.classList.remove("hidden");
    // Clear input fields for the next bill
    form.reset();
    generateNameFields();
});

// Format amounts as Indian rupees
function formatMoney(amount) {
    return amount.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}

// Save expense to localStorage
document.getElementById("saveBtn").addEventListener(
    "click", function () {
        if (!currentExpense) return;

        if (expenses.some(e => e.id === currentExpense.id)) {
            alert("This expense has already been saved.");
            return;
        }

        expenses.unshift(currentExpense);

        try {
            localStorage.setItem(
                "splitwiseExpenses",
                JSON.stringify(expenses)
            );
        } catch (error) {
            expenses.shift();
            alert("Unable to save data. Browser storage may be full.");
            return;
        }

        renderHistory();
        alert("Expense saved successfully!");
    }
);

// Display saved expenses
function renderHistory() {
    historyDiv.innerHTML = "";

    if (expenses.length === 0) {
        historyDiv.innerHTML = '<p class="empty">No saved expenses yet.</p>';
        return;
    }

    expenses.forEach(expense => {
        const item = document.createElement("div");
        item.className = "history-item";

        const details = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = expense.title;

        const total = document.createElement("p");
        total.textContent = `Total: ${formatMoney(expense.total)}`;

        const date = document.createElement("p");
        date.textContent = new Date(expense.date).toLocaleString();

        const people = document.createElement("p");
        people.textContent = `${expense.people.length} people · ` + expense.people.map(p => p.name).join(", ");

        details.append(title, total, date, people);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => {
            expenses = expenses.filter(e => e.id !== expense.id);
            saveHistory();
            renderHistory();
        });

        item.append(details, deleteBtn);
        historyDiv.appendChild(item);
    });
}

function saveHistory() {
    try {
        localStorage.setItem(
            "splitwiseExpenses",
            JSON.stringify(expenses)
        );
    } catch (error) {
        alert("Unable to update browser storage.");
    }
}

// Clear all history
document.getElementById("clearHistory").addEventListener(
    "click", function () {
        if (expenses.length === 0) return;

        if (confirm("Delete all saved expenses?")) {
            const previousExpenses = expenses;
            expenses = [];

            try {
                localStorage.setItem(
                    "splitwiseExpenses",
                    JSON.stringify(expenses)
                );
                renderHistory();
            } catch (error) {
                expenses = previousExpenses;
                alert("Unable to clear expense history.");
            }
        }
    }
);

// Light and dark mode
document.getElementById("themeToggle").addEventListener(
    "click", function () {
        document.body.classList.toggle("dark");
        localStorage.setItem(
            "splitwiseTheme",
            document.body.classList.contains("dark") ? "dark" : "light"
        );
        updateThemeButton();
    }
);

function updateThemeButton() {
    const isDark = document.body.classList.contains("dark");
    document.getElementById("themeToggle").textContent = isDark ? "☀️" : "🌙";
}

// Live date and time
function updateClock() {
    document.getElementById("clock").textContent =
        new Date().toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "medium"
        });
}

updateClock();
setInterval(updateClock, 1000);
