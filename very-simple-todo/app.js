// Initialize IndexedDB
const dbPromise = indexedDB.open('todoDB', 1);

// Upgrade the database (create object store)
dbPromise.onupgradeneeded = (event) => {
  const db = event.target.result;
  const todoStore = db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true });
  todoStore.createIndex('by_done', 'done');
};

dbPromise.onerror = (event) => {
  console.error('Database error:', event.target.error);
};

// Add a new task to IndexedDB
function addTaskToDB(task) {
  const dbRequest = dbPromise.result.transaction('todos', 'readwrite').objectStore('todos').add(task);
  dbRequest.onerror = (event) => {
    console.error('Error adding task:', event.target.error);
  };
}

// Fetch all tasks from IndexedDB
function fetchTasksFromDB() {
  const todoList = document.getElementById('todoList');
  todoList.innerHTML = '';
  const transaction = dbPromise.result.transaction('todos', 'readonly');
  const todoStore = transaction.objectStore('todos');
  
  todoStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const task = cursor.value;
      appendTaskToUI(task);
      cursor.continue();
    }
  };
}

// Update task state in IndexedDB
function updateTaskInDB(task) {
  const dbRequest = dbPromise.result.transaction('todos', 'readwrite').objectStore('todos').put(task);
  dbRequest.onerror = (event) => {
    console.error('Error updating task:', event.target.error);
  };
}

// Delete task from IndexedDB
function deleteTaskFromDB(id) {
  const dbRequest = dbPromise.result.transaction('todos', 'readwrite').objectStore('todos').delete(id);
  dbRequest.onerror = (event) => {
    console.error('Error deleting task:', event.target.error);
  };
}

// Add task to UI
function appendTaskToUI(task) {
  const todoList = document.getElementById('todoList');
  const listItem = document.createElement('li');
  listItem.innerHTML = `
    <label>
      <input type="checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}">
      ${task.text}
    </label>
    <button data-id="${task.id}" class="delete-btn">Delete</button>
  `;
  todoList.appendChild(listItem);
}

// Add new task
document.getElementById('todoForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const newTaskInput = document.getElementById('newTask');
  const taskText = newTaskInput.value.trim();

  if (taskText) {
    const task = { text: taskText, done: false };
    addTaskToDB(task);
    appendTaskToUI(task);
    newTaskInput.value = '';
  }
});

// Handle task state change and deletion
document.getElementById('todoList').addEventListener('click', (event) => {
  const element = event.target;
  const taskId = parseInt(element.getAttribute('data-id'), 10);

  if (element.tagName === 'INPUT') {
    // Checkbox toggled
    const transaction = dbPromise.result.transaction('todos', 'readonly');
    const store = transaction.objectStore('todos');
    store.get(taskId).onsuccess = (e) => {
      const task = e.target.result;
      task.done = element.checked;
      updateTaskInDB(task);
    };
  } else if (element.classList.contains('delete-btn')) {
    // Delete task
    deleteTaskFromDB(taskId);
    element.parentElement.remove();
  }
});

// Fetch tasks from the database on page load
dbPromise.onsuccess = fetchTasksFromDB;
