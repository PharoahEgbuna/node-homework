function register(req, res) {
    let user = {
        password: req.body.password,
        email: req.body.email,
        name: req.body.name
    };

    global.users.push(user);

    res.status(201).json({
        name: user.name,
        email: user.email
    });
}

function logon(req, res) {
    let email = req.body.email;
    let password = req.body.password;

    const user = global.users.find(user => user.email === email && user.password === password);

    if (user) {
        res.status(200).json({
            name: user.name,
            email: user.email
        });
    } else {
        res.status(401).json({
            message: "Invalid credentials"
        })
    }
}

function logoff(req, res) {
    global.user_id = null;

    res.status(200).json({
        message: "Logged out"
    });
}

module.exports = { register, logon, logoff }