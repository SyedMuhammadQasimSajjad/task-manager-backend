const taskInput = document.querySelector("#task-input");
const addtaskbtn = document.querySelector("#add-task-button");
const taskList = document.querySelector("#task-list");
const closeModalBtn = document.querySelector("#close-modal");
let tasks = [];
let currentFilter = 'all';
let pendingTaskText = "";

const API_URL = "/api/tasks";

// 🕒 1. Live Date Function (Audit Fix: Real-time Date format)
function updateLiveDate() {
    const dateElement = document.getElementById("current-date");
    if (dateElement) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }
}

// Add Task Button logic
function addTask() {
    const taskValue = taskInput.value.trim();

    if (taskValue === "") {
        alert("First Write Something");
        return;
    }
    pendingTaskText = taskValue;
    document.getElementById("priority-modal").style.display = "flex";
}

if(closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        document.getElementById("priority-modal").style.display = "none";
    });
}

// Priority buttons trigger
document.querySelectorAll(".p-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const selectedPriority = btn.getAttribute("data-p");
        finalizeTask(selectedPriority);
    });
});

// Save Task to Server
function finalizeTask(priority) {
    const taskData = {
        title: pendingTaskText,
        priority: priority,
        completed: false
    };
    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(taskData)
    })
        .then(res => res.json())
        .then(data => {
            loadTasksFromServer();
            document.getElementById("priority-modal").style.display = "none";
            taskInput.value = "";
            pendingTaskText = "";
        })
        .catch(err => console.log(err));
}

// Render UI
function renderTask() {
    taskList.innerHTML = "";
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'completed-list') return task.completed;
        return task.priority === currentFilter;
    });

    filteredTasks.forEach((task) => {
        const taskCard = document.createElement("div");
        taskCard.classList.add("task-card");
        if (task.priority) taskCard.classList.add(task.priority);
        if (task.completed) taskCard.classList.add("completed");

        taskCard.innerHTML = `
            <input type="checkbox" class="task-check" ${task.completed ? 'checked' : ''}>
            <span class="task-title"> ${task.title}</span>
            <i class="fa-solid fa-trash delete-icon"></i>
        `;

        // 🎯 Lag Fix: Direct Checkbox change handler (UI updates instantly without full server reload loop)
        const checkbox = taskCard.querySelector(".task-check");
        checkbox.addEventListener("change", (e) => {
            const isChecked = e.target.checked;

            // Local state ko foran update karo taake stuck na ho
            task.completed = isChecked;
            if (isChecked) {
                taskCard.classList.add("completed");
            } else {
                taskCard.classList.remove("completed");
            }

            // Progress stats recalculate karo smoothly
            calculateStats();

            // Backend par chupke se save karwao background mein
            toggleTaskOnServer(task._id, isChecked);
        });

        // Direct Trash Listener
        const deleteIcon = taskCard.querySelector(".delete-icon");
        deleteIcon.addEventListener("click", () => {
            // Local array se mitao foran fast feedback ke liye
            tasks = tasks.filter(t => t._id !== task._id);
            renderTask();

            fetch(`${API_URL}/${task._id}`, { method: "DELETE" })
                .catch(err => console.log(err));
        });

        taskList.appendChild(taskCard);
    });

    calculateStats();
}

// 📊 Statistics Calculation
function calculateStats() {
    const totalCount = tasks.length;
    const completedCount = tasks.filter(task => task.completed).length;

    const totalElements = document.getElementById("total-count");
    const completedElements = document.getElementById("completed-count");

    if (totalElements && completedElements) {
        totalElements.innerText = totalCount;
        completedElements.innerText = completedCount;
    }
    updateProgressBar(completedCount, totalCount);
}

// Progress Bar Logic
function updateProgressBar(completed, total) {
    const progressBar = document.getElementById("progress-fill");
    if (!progressBar) return;
    if (total === 0) {
        progressBar.style.width = "0%";
        return;
    }
    const percentage = Math.round((completed / total) * 100);
    progressBar.style.width = percentage + "%";
}

addtaskbtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') addTask();
});

// Send PUT Request (Background execution without reload lag)
function toggleTaskOnServer(id, isChecked) {
    fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: isChecked })
    })
        .catch(err => console.log(err));
}

// Filter Buttons Logic
document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        const category = button.getAttribute("data-category");
        document.querySelectorAll(".filter-btn").forEach(li => li.classList.remove("active"));
        button.classList.add("active");
        currentFilter = category;
        renderTask();
    });
});

// Fetch Data From Server
function loadTasksFromServer() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            tasks = data;
            renderTask();
        })
        .catch(error => console.log(error));
}

// Onload setup
window.onload = () => {
    loadTasksFromServer();
    updateLiveDate(); // Live date running setup
};