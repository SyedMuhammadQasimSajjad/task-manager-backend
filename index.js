const taskInput = document.querySelector("#task-input");
const addtaskbtn = document.querySelector("#add-task-button");
const taskList = document.querySelector("#task-list");
const closeModalBtn = document.querySelector("#close-modal");
let tasks = [];
let currentFilter = 'all';
let pendingTaskText = "";

const API_URL = "/api/tasks";

// 1. Add Task Button logic
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

// 2. Priority buttons trigger
document.querySelectorAll(".p-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const selectedPriority = btn.getAttribute("data-p");
        finalizeTask(selectedPriority);
    });
});

// 3. Save Task to Server
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

// 4. Render UI
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
            <input type="checkbox" class="task-check" data-id="${task._id}" ${task.completed ? 'checked' : ''}>
            <span class="task-title"> ${task.title}</span>
            <i class="fa-solid fa-trash delete-icon" data-id="${task._id}"></i>
        `;
        taskList.appendChild(taskCard);
    });

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

// 5. Progress Bar Logic
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

// 6. Handle Clicks inside Task List
taskList.addEventListener("click", (e) => {
    // TRASH ICON CLICK
    if (e.target.classList.contains("delete-icon")) {
        const id = e.target.getAttribute("data-id");
        fetch(`${API_URL}/${id}`, { method: "DELETE" })
            .then(res => res.json())
            .then(() => loadTasksFromServer())
            .catch(err => console.log(err));
    }

    // CHECKBOX CLICK
    if (e.target.classList.contains("task-check")) {
        const idToToggle = e.target.getAttribute("data-id");
        const isChecked = e.target.checked;
        toggleTaskOnServer(idToToggle, isChecked);
    }
});

addtaskbtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') addTask();
});

// 8. 🛠️ Audit Fix: Send PUT Request to save check state permanently in MongoDB
function toggleTaskOnServer(id, isChecked) {
    fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: isChecked })
    })
        .then(res => res.json())
        .then(() => loadTasksFromServer())
        .catch(err => console.log(err));
}

// 9. Filter Buttons Logic
document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        const category = button.getAttribute("data-category");
        document.querySelectorAll(".filter-btn").forEach(li => li.classList.remove("active"));
        button.classList.add("active");
        currentFilter = category;
        renderTask();
    });
});

// 10. Fetch Data From Server
function loadTasksFromServer() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            tasks = data;
            renderTask();
        })
        .catch(error => console.log(error));
}

window.onload = loadTasksFromServer;