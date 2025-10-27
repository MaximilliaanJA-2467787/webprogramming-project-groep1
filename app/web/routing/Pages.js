const Pages = {
    error: {
        name: 'Error',
        layout: 'layouts/error-layout',
        view: 'pages/error',
        route: null,
    },

    home: {
        name: 'Home',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/',
    },

    profile: {
        name: 'Profile',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/',
    },

    wallet: {
        name: 'Wallet',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/',
    },

    groups: {
        name: 'Groups',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/',
    },

    budgets: {
        name: 'Budgets',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/',
    },

    support: {
        name: 'Support',
        layout: 'layouts/default-layout',
        view: 'pages/guest/support',
        route: '/support',
    },

    login: {
        name: 'Login',
        layout: 'layouts/default-layout',
        view: 'pages/auth/login',
        route: '/auth/login',
    },

    register: {
        name: 'Register',
        layout: 'layouts/default-layout',
        view: 'pages/auth/register',
        route: '/auth/register',
    },

    forgotPassword: {
        name: 'Forgot Password',
        layout: 'layouts/default-layout',
        view: 'pages/auth/forgot-password',
        route: '/auth/forgot-password',
    },

    resetPassword: {
        name: 'Reset Password',
        layout: 'layouts/default-layout',
        view: 'pages/auth/reset-password',
        route: '/auth/reset-password',
    },
};

module.exports = Pages;
