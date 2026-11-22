const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

async function register(req, res, next) {
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            details: error.details,
        });
    } 
    
    let user;
    value.hashedPassword = await hashPassword(value.password);
    
    try {
        user = await prisma.user.create({
            data: {name: value.name, email: value.email, hashedPassword: value.hashedPassword },
            select: {name: true, email:true, id: true}
        });
    } catch (err) {
        if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
            return res.status(400).json({
                message: "User already exists"
            });
        } else {
            return next(err);
        }
    }

    global.user_id = user.id;

    res.status(201).json({
        name: user.name,
        email: user.email
    });
}

async function logon(req, res) {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return res.status(401).json({
            message: "User not found"
        });
    }

    const goodCredentials = user && await comparePassword(password, user.hashedPassword);

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