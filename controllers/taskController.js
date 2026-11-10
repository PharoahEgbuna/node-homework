const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

// const taskCounter = (() => {
//   let lastTaskNumber = 0;
//   return () => {
//     lastTaskNumber += 1;
//     return lastTaskNumber;
//   };
// })();

async function create(req, res) {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

    if (error) return res.status(400).json({ message: "Failed to create" })
    
    const result = await pool.query(
        "INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING id, title, is_completed",
        [value.title, value.isCompleted, global.user_id]
    );
    const task = result.rows[0];

    // global.tasks.push(task);
    // const { userId, ...sanitizedTask } = task;

    res.status(201).json(task)
}

async function index(req, res) {
    // const userTasks = global.tasks.filter((task) => task.userId === global.user_id.email);

    const result = await pool.query(
        "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
        [global.user_id])

    if (result.rows.length === 0) {
        return res.status(404).json({
            message: "No tasks for user"
        });
    }

    res.status(200).json(result.rows);
}

async function show(req, res) {
    const taskId = parseInt(req.params?.id);

    if (Number.isNaN(taskId) ) {
        return res.status(400).json({
            message: "Invalid id",
        });
    }

    let result = await pool.query(
        "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
        [taskId, global.user_id]
    );

    // let findTask = global.tasks.find((task) => task.userId === global.user_id.email && taskId === task.id);

    if (!result.rows?.length) {
        return res.status(404).json({
            message: "No matching task for that id"
        });
    }

    // const { userId, ...sanitizedTask } = findTask;

    const foundTask = result.rows[0];

    res.status(200).json(foundTask);
}

async function update(req, res) {
    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            message: "Invalid task data",
        });
    }

    let keys = Object.keys(value);
    keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const idParm = `$${keys.length + 1}`;
    const userParm = `$${keys.length + 2}`;
    const result = await pool.query(`UPDATE tasks SET ${setClauses}
    WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`, 
    [...Object.values(value), req.params.id, global.user_id]);
    const updatedTask = result.rows[0];
    // const id = parseInt(req.params?.id);

    // const task = global.tasks.find((task) => task.userId === global.user_id.email && id === task.id);

    if (!result.rows?.length) {
        return res.status(404).json({
            message: "No matching task found for that id",
        });
    }

    //Object.assign(task, value);
    // const { userId, ...sanitizedTask } = task;

    res.status(200).json(updatedTask);
}
    
async function deleteTask(req, res) {
    const taskId = parseInt(req.params?.id);

    if (Number.isNaN(taskId) ) {
        return res.status(400).json({
            message: "Invalid task ID",
        })
    }

    // const taskIndex = global.tasks.findIndex((task) => task.userId === global.user_id.email && id === task.id);
    const result = await pool.query(
        "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
        [req.params?.id, global.user_id]
    );
    
    // let task = global.tasks[taskIndex];

    if (!result.rows?.length) {
        return res.status(404).json({
            message: "No matching task found for that id",
        });
    }   

    const removedTask = result.rows[0];

    // const { userId, ...sanitizedTask } = removedTask[0];

    res.status(200).json(removedTask);
}

module.exports = {
    create,
    index,
    show,
    update, 
    deleteTask
}