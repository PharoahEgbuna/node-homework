const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const pool = require("../db/pg-pool");

async function register(req, res, next) {
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            details: error.details,
        });
    } 

    let result = null;
    value.hashed_password = await hashPassword(value.password);

    try {
        result = await pool.query(`INSERT INTO users (email, name, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, name`, 
            [value.email, value.name, value.hashed_password]);
    } catch (e) {
        if (e.code === "23505") {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        return next(e);
    }

    // let hashedPassword = await hashPassword(value.password);
    const user = result.rows[0];

    global.user_id = user.id;
    // global.users.push(user);

    res.status(201).json({
        name: user.name,
        email: user.email
    });
}

async function logon(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (!result.rows?.length) {
        return res.status(401).json({
            message: "User not found"
        });
    }

    const user = result.rows[0];    
    const goodCredentials = user && await comparePassword(password, result.rows[0].hashed_password);

    if (!goodCredentials) {
        return res.status(401).json({
            message: "Credentials don't match"
        });
    }

    global.user_id = user.id;

    res.status(200).json({
        name: user.name,
        email: user.email
    });
}

function logoff(req, res) {
    global.user_id = null;

    res.status(200).json({
        message: "Logged out"
    });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

module.exports = { register, logon, logoff }