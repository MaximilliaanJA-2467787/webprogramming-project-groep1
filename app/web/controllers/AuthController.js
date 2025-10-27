const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { databaseRef } = require('../../base/database/index');
const config = require('../../config/Config');

const SALT_ROUNDS = config.session.salt_rounds;

/**
 * Small helpers to make session callbacks promise friendly
 */
function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function destroySession(req) {
    return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function wantsHtml(req) {
    const accept = req.headers.accept || '';
    return (
        accept.includes('text/html') ||
        req.headers['content-type'] === 'application/x-www-form-urlencoded'
    );
}

const AuthController = {
    // POST /auth/register
    register: async (req, res) => {
        // accept either name or firstName+lastName from the form
        let { email, password, name, role, firstName, lastName } = req.body;
        if (!name && (firstName || lastName)) {
            name = `${firstName || ''} ${lastName || ''}`.trim();
        }

        if (!email || !password || !name) {
            if (wantsHtml(req)) {
                return res.redirect(
                    '/auth/register?error=' + encodeURIComponent('Missing required fields')
                );
            }
            return res.status(400).json({ error: 'missing fields' });
        }

        try {
            const existing = databaseRef.get('SELECT id FROM Users WHERE email = ?', [email]);
            if (existing) {
                if (wantsHtml(req)) {
                    return res.redirect(
                        '/auth/register?error=' + encodeURIComponent('Email already registered')
                    );
                }
                return res.status(409).json({ error: 'Email already registered' });
            }

            const hash = await bcrypt.hash(password, SALT_ROUNDS);
            const info = databaseRef.run(
                `INSERT INTO Users (uuid, email, password_hash, name, role, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [uuidv4(), email, hash, name, role || 'user']
            );

            const insertedId = info && info.lastInsertRowid;
            const user = databaseRef.get('SELECT id, email, name, role FROM Users WHERE id = ?', [
                insertedId,
            ]);

            // Regenerate session to prevent fixation and store minimal user info
            await regenerateSession(req);
            req.session.user = { id: user.id, email: user.email, role: user.role, name: user.name };

            // Redirect for HTML form, JSON for API
            if (wantsHtml(req)) {
                return res.redirect('/dashboard?success=' + encodeURIComponent('Welcome!'));
            }
            return res.json({ user });
        } catch (err) {
            console.error('Register error:', err);
            if (wantsHtml(req)) {
                return res.redirect(
                    '/auth/register?error=' + encodeURIComponent('Internal server error')
                );
            }
            return res.status(500).json({ error: 'internal error' });
        }
    },

    // POST /auth/login
    login: async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            if (wantsHtml(req)) {
                return res.redirect(
                    '/auth/login?error=' + encodeURIComponent('Missing credentials')
                );
            }
            return res.status(400).json({ error: 'missing fields' });
        }

        try {
            const row = databaseRef.get(
                'SELECT id, email, password_hash, name, role FROM Users WHERE email = ?',
                [email]
            );
            if (!row) {
                if (wantsHtml(req)) {
                    return res.redirect(
                        '/auth/login?error=' + encodeURIComponent('Invalid credentials')
                    );
                }
                return res.status(401).json({ error: 'invalid credentials' });
            }

            const ok = await bcrypt.compare(password, row.password_hash);
            if (!ok) {
                if (wantsHtml(req)) {
                    return res.redirect(
                        '/auth/login?error=' + encodeURIComponent('Invalid credentials')
                    );
                }
                return res.status(401).json({ error: 'invalid credentials' });
            }

            await regenerateSession(req);
            req.session.user = { id: row.id, email: row.email, role: row.role, name: row.name };

            if (wantsHtml(req)) {
                return res.redirect('/dashboard');
            }
            return res.json({
                message: 'ok',
                user: { id: row.id, email: row.email, role: row.role, name: row.name },
            });
        } catch (err) {
            console.error('Login error:', err);
            if (wantsHtml(req)) {
                return res.redirect(
                    '/auth/login?error=' + encodeURIComponent('Internal server error')
                );
            }
            return res.status(500).json({ error: 'internal error' });
        }
    },

    // POST /auth/logout
    logout: async (req, res) => {
        try {
            await destroySession(req);
            // clear cookie name — may be different in your config; default express-session cookie name is 'connect.sid'
            res.clearCookie('connect.sid');
            if (wantsHtml(req)) {
                return res.redirect('/auth/login?success=' + encodeURIComponent('Logged out'));
            }
            return res.json({ message: 'logged out' });
        } catch (err) {
            console.error('Logout error:', err);
            if (wantsHtml(req)) {
                return res.redirect('/?error=' + encodeURIComponent('Logout failed'));
            }
            return res.status(500).json({ error: 'logout failed' });
        }
    },

    // GET /auth/login (render page) — redirect if already logged in
    showLogin: (req, res) => {
        if (req.session && req.session.user && req.session.user.id) {
            return res.redirect('/dashboard');
        }

        const { error, success } = req.query;
        return res.render('pages/auth/login', {
            title: 'Login - CashLess Events',
            user: null,
            error: error ? decodeURIComponent(error) : null,
            success: success ? decodeURIComponent(success) : null,
        });
    },

    // GET /auth/register (render page) — redirect if already logged in
    showRegister: (req, res) => {
        if (req.session && req.session.user && req.session.user.id) {
            return res.redirect('/dashboard');
        }

        const { error, success } = req.query;
        return res.render('pages/auth/register', {
            title: 'Register - CashLess Events',
            user: null,
            error: error ? decodeURIComponent(error) : null,
            success: success ? decodeURIComponent(success) : null,
        });
    },

    // GET /auth/forgot-password (render)
    showForgotPassword: (req, res) => {
        if (req.session && req.session.user && req.session.user.id) {
            return res.redirect('/dashboard');
        }
        const { success, error } = req.query;
        return res.render('pages/auth/forgot-password', {
            title: 'Forgot Password - CashLess Events',
            user: req.session.user || null,
            success: success ? decodeURIComponent(success) : null,
            error: error ? decodeURIComponent(error) : null,
        });
    },

    // POST /auth/forgot-password (stub)
    forgotPassword: (req, res) => {
        const { email } = req.body;
        // TODO: generate token, store, send email
        return res.redirect(
            '/auth/forgot-password?success=' +
                encodeURIComponent('Password reset instructions sent to your email')
        );
    },

    // GET /auth/reset-password?token=...
    showResetPassword: (req, res) => {
        if (req.session && req.session.user && req.session.user.id) {
            return res.redirect('/dashboard');
        }
        const { token } = req.query;
        if (!token) {
            return res.redirect(
                '/auth/forgot-password?error=' + encodeURIComponent('Invalid reset token')
            );
        }
        return res.render('pages/auth/reset-password', {
            title: 'Reset Password - CashLess Events',
            token,
            user: req.session.user || null,
        });
    },

    // POST /auth/reset-password
    resetPassword: async (req, res) => {
        const { token, password, confirmPassword } = req.body;
        if (!token)
            return res.redirect(
                '/auth/forgot-password?error=' + encodeURIComponent('Invalid token')
            );
        if (!password || password !== confirmPassword)
            return res.redirect(
                '/auth/reset-password?token=' +
                    encodeURIComponent(token) +
                    '&error=' +
                    encodeURIComponent('Passwords do not match')
            );

        // TODO: validate token, find userId, hash new password, update Users.password_hash
        // For now just show success
        return res.redirect(
            '/auth/login?success=' + encodeURIComponent('Password reset successfully')
        );
    },

    // GET /dashboard
    dashboard: (req, res) => {
        if (!req.session.user) {
        }

        return res.render('pages/user/dashboard', {
            title: 'Dashboard - CashLess Events',
            user: req.session.user,
        });
    },
};

module.exports = AuthController;
