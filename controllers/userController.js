const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");

async function register(req, res) {
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            message: "Invalid register fields"
        });
    } 

    let hashedPassword = await hashPassword(value.password);
    let user = {
        hashedPassword,
        email: value.email,
        name: value.name
    };

    global.user_id = user;
    global.users.push(user);

    res.status(201).json({
        name: user.name,
        email: user.email
    });
}

async function logon(req, res) {
    const user = global.users.find(user => user.email === req.body.email);
    const password = req.body.password;
    const goodCredentials = user && await comparePassword(password, user.hashedPassword);

    if (!goodCredentials) {
        return res.status(401).json({
            message: "Credentials don't match"
        });
    }

    global.user_id = user;
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