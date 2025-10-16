const BaseMiddleware = require('../../base/middleware');

class LayoutDataMiddleware extends BaseMiddleware {
    constructor() {
        super('LayoutDataHandler');
    }

    async handle(req, res, next) {
        const navLinks = [
            { name: 'Home', route: 'home', href: '/' },
            { name: 'Support', route: 'support', href: '/support' },
            { name: 'About', route: 'about', href: '/about' },
        ];

        const userActions = [
            { name: 'profile', route: 'profile', icon: 'bi bi-person' },
            { name: 'wallet', route: 'wallet', icon: 'bi bi-wallet2' },
            { name: 'groups', route: 'groups', icon: 'bi bi-people' },
            { name: 'budgets', route: 'budgets', icon: 'bi bi-piggy-bank' },
            {
                name: 'logout',
                route: 'logout',
                icon: 'bi bi-box-arrow-right',
                asForm: true,
                method: 'post',
            },
        ];

        res.locals.user = {
            name: 'Mathijs',
        };
        res.locals.brand = 'CashLess';
        res.locals.logoUrl = '/images/logo.png';
        res.locals.navLinks = navLinks;
        res.locals.userActions = userActions;
        next();
    }
}

const layoutDataHandler = new LayoutDataMiddleware().bind();
module.exports = layoutDataHandler;
