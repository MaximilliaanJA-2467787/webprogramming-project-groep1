const Pages = {
    'error': {
        name: 'Error',
        layout: 'layouts/error-layout',
        view: 'pages/error',
        route: null
    },

    'home': {
        name: 'Home',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/'
    },

    'profile': {
        name: 'Profile',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/'
    },

    'wallet': {
        name: 'Wallet',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/'
    },

    'groups': {
        name: 'Groups',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/'
    },

    'budgets': {
        name: 'Budgets',
        layout: 'layouts/default-layout',
        view: 'pages/guest/index',
        route: '/'
    },
    
    'support': {
        name: 'Support',
        layout: 'layouts/default-layout',
        view: 'pages/support',
        route: '/support'
    }
};

module.exports = Pages;