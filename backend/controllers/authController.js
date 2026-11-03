const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtSecret');

const prisma = new PrismaClient();

function publicUser(user) {
    const { password: _password, ...safeUser } = user;
    return safeUser;
}

function issueToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name || undefined },
        getJwtSecret(),
        { expiresIn: '7d' }
    );
}

exports.register = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = req.body.password;
        const name = String(req.body.name || '').trim();

        if (!email || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Email and a password of at least 6 characters are required.' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists with this email.' });
        }

        const newUser = await prisma.user.create({
            data: {
                email,
                password: await bcrypt.hash(password, 10),
                name: name || null,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            token: issueToken(newUser),
            user: publicUser(newUser),
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error occurred.' });
    }
};

exports.login = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = req.body.password;

        if (!email || typeof password !== 'string' || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            token: issueToken(user),
            user: publicUser(user),
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error occurred.' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ success: false, error: 'Invalid user ID.' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        return res.status(200).json({ success: true, user: publicUser(user) });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error occurred.' });
    }
};
