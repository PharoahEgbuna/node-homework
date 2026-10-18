function notFound(req, res) {
    res.status(404).json({
        message: "That route is not available.",
    })
}

module.exports = notFound;