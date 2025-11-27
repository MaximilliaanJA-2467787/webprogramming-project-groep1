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
        route: '/profile',
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

    analytics: {
        name: 'Analytics',
        layout: 'layouts/default-layout',
        view: 'pages/user/analytics',
        route: '/analytics',
    },

    transactions: {
       name: 'Transactions',
       layout: 'layouts/default-layout',
       view: 'pages/user/allTransactions',
       route: '/transactions',
    },

    wallet: {
        name: 'Wallet',
        layout: 'layouts/default-layout',
        view: 'pages/user/wallet',
        route: '/wallet',
    },

    payments: {
        pay: {
            name: 'Pay',
            layout: 'layouts/default-layout',
            view: 'pages/payments/pay',
            route: '/payments/pay/:uuid',
        },
        scan: {
            name: 'Scan',
            layout: 'layouts/default-layout',
            view: 'pages/payments/scan',
            route: '/payments/scan',
        },
        success: {
            name: 'Payment Success',
            layout: 'layouts/default-layout',
            view: 'pages/payments/success',
            route: '/payments/success',
        },
        error: {
            name: 'Payment Error',
            layout: 'layouts/default-layout',
            view: 'pages/payments/error',
            route: '/payments/error',
        },
    },

    vendor: {
        index: {
            name: 'Vendor Dashboard',
            layout: 'layouts/vendor-layout',
            view: 'pages/vendor/index',
            route: '/vendor',
        },

        checkout: {
            name: 'Vendor Checkout',
            layout: 'layouts/vendor-layout',
            view: 'pages/vendor/checkout',
            route: '/vendor/checkout',
        },
    },

    admin: {
        index: {
            name: 'Admin Dashboard',
            layout: 'layouts/admin-layout',
            view: 'pages/admin/index',
            route: '/admin',
        },

        tables: {
            name: 'Admin Dashboard',
            layout: 'layouts/admin-layout',
            view: 'pages/admin/tables',
            route: '/admin/tables',
        },

        table: {
            name: 'Admin Dashboard',
            layout: 'layouts/admin-layout',
            view: 'pages/admin/table',
            route: '/admin/tables/:name',
        },
    },
};

module.exports = Pages;
