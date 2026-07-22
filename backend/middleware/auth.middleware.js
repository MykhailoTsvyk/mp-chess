// Regex to validate email and username
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernameRegex = /^[a-zA-Z0-9_]+$/

export const validateRegistration = (req, res, next) => {
    let {username, email, password} = req.body
    const errors = []

    // Presence check
    if (!username || typeof username !== 'string') {
        errors.push({ field: 'username', message: 'Username is required and must be text' })
    }
    if (!email || typeof email !== 'string') {
        errors.push({ field: 'email', message: 'Email is required and must be text' })
    }
    if (!password || typeof password !== 'string') {
        errors.push({ field: 'password', message: 'Password is required and must be text' })
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: 'fail', errors })
    }

    username = username.trim()
    email = email.trim().toLowerCase()

    if (username.length < 3 || username.length > 20) {
        errors.push({ field: 'username', message: 'Username must be between 3 and 20 characters long' })
    }
    if (!usernameRegex.test(username)) {
        errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' })
    }
    if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Invalid email address format' })
    }
    if (password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters long' })
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: 'fail', errors })
    }

    req.body.username = username
    req.body.email = email

    next()
}

export const validateLogin = (req, res, next) => {
    let {email, password} = req.body

    const errors = []

    //Presence check
    if (!email || typeof email !== 'string') {
        errors.push({ field: 'email', message: 'Email is required and must be text' })
    }
    if (!password || typeof password !== 'string') {
        errors.push({ field: 'password', message: 'Password is required and must be text' })
    }

    //Break if error is already found
    if (errors.length > 0) {
        return res.status(400).json({ status: 'fail', errors })
    }

    email = email.trim().toLowerCase()

    //Regex test for email type
    if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Invalid email address format' })
    }
    if (password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters long' })
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: 'fail', errors })
    }

    req.body.email = email

    next()
}

export const protectedAuthMiddleware =   (req, res, next)=> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const accessToken = authHeader.split(" ")[1];

        if (!accessToken) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const userData = tokenService.validateAccess(accessToken);

        if (!userData) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        req.user = userData;

        next();

    } catch (e) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
}