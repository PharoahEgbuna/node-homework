const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

async function create(req, res) {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

    if (error) return res.status(400).json({ message: "Failed to create" })
    
    const task = {
        id: taskCounter(),
        userId: global.user_id.email,
        ...value
    }

    global.tasks.push(task);
    const { userId, ...sanitizedTask } = task;

    res.status(201).json(sanitizedTask)
}

function index(req, res) {
    const userTasks = global.tasks.filter((task) => task.userId === global.user_id.email);

    if (userTasks.length === 0) {
        return res.status(404).json({
            message: "No tasks for user"
        });
    }

    res.status(200).json(userTasks.map((task) => {
        const { userId, ...sanitizedTask } = task;
        return sanitizedTask;
    }));
}

function show(req, res) {
    const taskId = parseInt(req.params?.id);

    if (!taskId) {
        return res.status(400).json({
            message: "Invalid id",
        });
    }

    let findTask = global.tasks.find((task) => task.userId === global.user_id.email && taskId === task.id);

    if (!findTask) {
        return res.status(404).json({
            message: "No matching task for that id"
        });
    }

    const { userId, ...sanitizedTask } = findTask;

    res.status(200).json(sanitizedTask);
}

function update(req, res) {
    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            message: "Invalid task data",
        });
    }

    const id = parseInt(req.params?.id);

    const task = global.tasks.find((task) => task.userId === global.user_id.email && id === task.id);

    if (!task) {
        return res.status(404).json({
            message: "No matching task found for that id",
        });
    }

    Object.assign(task, value);

    const { userId, ...sanitizedTask } = task;

    res.status(200).json(sanitizedTask);
}

function deleteTask(req, res) {
    const id = parseInt(req.params?.id);

    if (!id) {
        return res.status(400).json({
            message: "Invalid task ID",
        })
    }

    const taskIndex = global.tasks.findIndex((task) => task.userId === global.user_id.email && id === task.id);

    let task = global.tasks[taskIndex];

    if (!task) {
        return res.status(404).json({
            message: "No matching task found for that id",
        });
    }

    const removedTask = global.tasks.splice(taskIndex, 1);

    const { userId, ...sanitizedTask } = removedTask[0];

    res.status(200).json(sanitizedTask);
}

module.exports = {
    create,
    index,
    show,
    update, 
    deleteTask
}