const prisma = require("../db/prisma");
const { analyticTaskSchema } = require("../validation/taskSchema");

async function getUserAnalytics(req, res, next) {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    const findUser = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });

    if (!findUser) {
        res.status(404).json({
            message: "User not found"
        })
        return;
    }

    try {
        const taskStats = await prisma.task.groupBy({
            by: ['isCompleted'],
            where: { userId },
            _count: {
                id: true
            }
        })

        const recentTasks = await prisma.task.findMany({
            where: {userId},
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                userId: true,
                User: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyProgress = await prisma.task.groupBy({
            by: ['createdAt'],
            where: {
                userId,
                createdAt: { gte: oneWeekAgo }
            },
            _count: {
                id: true
            }
        })

        res.status(200).json({ taskStats, recentTasks, weeklyProgress });
        return;

    } catch(err) {
        next(err);
    }
}

async function getUsersWithStats (req, res) {
    const { error, value } = analyticTaskSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            message: "Invalid page number or limit size",
        })
    }
    
    const page = value.page;
    const limit = value.limit;
    const skip = (page - 1) * limit;

    const usersRaw = await prisma.user.findMany({
        include: {
            Task: {
            where: { isCompleted: false },
            select: { id: true },
            take: 5
            },
            _count: {
            select: {
                Task: true
            }
            }
        },
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
    });

    const users = usersRaw.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        _count: user._count,
        Task: user.Task
    }));

    const total = await prisma.user.count();

    const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1

    };
    
    res.status(200).json({ users, pagination });
}

async function searchTasks (req, res) {
    const searchQuery = req.query.q;
    if (!searchQuery || searchQuery.trim().length < 2) {
        return res.status(400).json({ 
            error: "Search query must be at least 2 characters long" 
        });
    }

    const limit = req.query.limit || 20;

    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;

    const searchResults = await prisma.$queryRaw`
    SELECT 
        t.id,
        t.title,
        t.is_completed as "isCompleted",
        t.priority,
        t.created_at as "createdAt",
        t.user_id as "userId",
        u.name as "user_name"
    FROM tasks t
    JOIN users u ON t.user_id = u.id
    WHERE t.title ILIKE ${searchPattern} 
        OR u.name ILIKE ${searchPattern}
    ORDER BY 
        CASE 
        WHEN t.title ILIKE ${exactMatch} THEN 1
        WHEN t.title ILIKE ${startsWith} THEN 2
        WHEN t.title ILIKE ${searchPattern} THEN 3
        ELSE 4
        END,
        t.created_at DESC
    LIMIT ${parseInt(limit)}
    `;

    res.status(200).json({ results: searchResults, query: searchQuery, count: searchResults.length})

}

module.exports = {
    getUserAnalytics,
    getUsersWithStats,
    searchTasks
};