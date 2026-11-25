const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

async function create(req, res) {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

    if (error) return res.status(400).json({ message: "Failed to create" })

    const createdTask = await prisma.task.create({
        data: { title: value.title, isCompleted: value.isCompleted, userId: global.user_id, priority: value.priority},
        select: { id: true, title: true, isCompleted: true, priority: true}
    });

    const task = createdTask;

    res.status(201).json(task)
}

async function index(req, res) {    
    const whereClause = { userId: global.user_id };
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const skip = (page - 1) * limit;

    const getOrderBy = (query) => {
        const validSortFields = ["title", "priority", "createdAt", "id", "isCompleted"];
        const sortBy = query.sortBy || "createdAt";
        const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  
        if (validSortFields.includes(sortBy)) {
            return { [sortBy]: sortDirection };
        }
        return { createdAt: "desc" };
    };

    if (req.query.find) {
        whereClause.title = { 
            contains: req.query.find,
            mode: 'insensitive' 
        };
    }

    const tasks = await prisma.task.findMany({ 
        where: whereClause,
        select: { 
            id: true, 
            title: true, 
            isCompleted: true,
            priority: true,
            createdAt: true,
            User: {
                select: {
                    name: true,
                    email: true
                }
            }

        },
        skip: skip,
        take: limit,
        orderBy: getOrderBy(req.query)
    });

    const totalTasks = await prisma.task.count({
        where: whereClause
    });
    
    const pagination = {
        page,
        limit,
        total: totalTasks,
        pages: Math.ceil(totalTasks / limit),
        hasNext: page * limit < totalTasks,
        hasPrev: page > 1
    }

    if (tasks.length === 0) {
        return res.status(200).json({tasks: [], pagination });
    }

    res.status(200).json({ tasks, pagination });
}

async function show(req, res, next) {
    const taskId = parseInt(req.params?.id); 

    if (Number.isNaN(taskId) ) {
        return res.status(400).json({
            message: "Invalid id",
        });
    }

    let task;
    try {
        task = await prisma.task.findUniqueOrThrow({
            where: {
                id: taskId,
                userId: global.user_id
            },
            select: { id: true, title: true, isCompleted: true }
        });

    } catch (err) {
        if (err.code === 'P2025') { 
            return res.status(404).json({ message: "The task was not found for that id." });
        } else {
            return next(err);
        }
    }

    res.status(200).json(task);
    // const userId = parseInt(req.params.id);
    
    // if (isNaN(userId)) {
    //     return res.status(400).json({ error: "Invalid user ID" });
    // }

    // if (userId !== global.user_id) {
    //     return res.status(403).json({ error: "Forbidden" });
    // }

    // const user = await prisma.user.findUnique({
    //     where: { id: userId },
    //     select: {
    //     id: true,
    //     name: true,
    //     email: true,
    //     createdAt: true,
    //     Task: {
    //         where: { isCompleted: false },
    //         select: { 
    //         id: true, 
    //         title: true, 
    //         priority: true,
    //         createdAt: true 
    //         },
    //         orderBy: { createdAt: 'desc' },
    //         take: 5
    //     }
    //     }
    // });

    // if (!user) {
    //     return res.status(404).json({ message: "User not found" });
    // }

    // res.status(200).json(user);
}

async function bulkCreate (req, res, next)  {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: "Invalid request data. Expected an array of tasks." });
    }

    const validTasks = [];

    for (const task of tasks) {
        const { error, value } = taskSchema.validate(task, { abortEarly: false });
        if (error) {
            return res.status(400).json({ error: "Validation failed", details: error.details });
        }

        validTasks.push({
            title: value.title,
            isCompleted: value.isCompleted || false,
            priority: value.priority || "medium",
            userId: global.user_id
        });
    }

    try {
        const result = await prisma.task.createMany({
            data: validTasks,
            skipDuplicates: true
        });

        res.status(201).json({ message: "Bulk task creation successful", tasksCreated: result.count, totalRequested: validTasks.length});
    } catch (err) {
        return next(err);
    }
}

async function update(req, res, next) {
    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            message: "Invalid task data",
        });
    }

    const id = parseInt(req.params?.id);
    let task;

    try {
        task = await prisma.task.update({
            data: value,
            where: {
                id,
                userId: global.user_id
            },
            select: { id: true, title: true, isCompleted: true, priority: true }
        });
        
        if (!task) { throw new Error("The task was not found.") }

        res.status(200).json(task);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: "The task was not found." });
        } else {
            return next(err);
        }
    }
}
    
async function deleteTask(req, res, next) {
    const taskId = parseInt(req.params?.id);

    if (Number.isNaN(taskId) ) {
        return res.status(400).json({
            message: "Invalid task ID",
        })
    }

    let deletedTask;

    try {
        deletedTask = await prisma.task.delete({
            where: {
                id: taskId,
                userId: global.user_id
            },
            select: { id: true, title: true, isCompleted: true }
        });

        if (!deletedTask) { throw new Error("The task was not found.") }
        res.status(200).json(deletedTask);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: "The task was not found." });
        } else {
            return next(err);
        }
    }
}

module.exports = {
    create,
    index,
    show,
    update,
    bulkCreate,
    deleteTask
}