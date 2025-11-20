const Pages = require('../routing/Pages.js');

const LocalsHandler = (req, res, next) => {
    const navLinks = [Pages.home, Pages.support];

    const userActions = [
        { page: Pages.profile, icon: 'bi bi-person' },
        { page: Pages.wallet, icon: 'bi bi-wallet2' },
        { page: Pages.analytics, icon: 'bi bi-graph-up' },
        { page: Pages.groups, icon: 'bi bi-people' },
        { page: Pages.budgets, icon: 'bi bi-piggy-bank' },
    ];

    res.locals.user = req.session.user || null;
    res.locals.brand = 'CashLess';
    res.locals.logoUrl = '/images/logo.png';
    res.locals.navLinks = navLinks;
    res.locals.userActions = userActions;
    res.locals.pages = Pages;
    res.locals.title = 'CashLess';
    res.locals.currentRoute = req.path;
    next();
};

module.exports = LocalsHandler;
