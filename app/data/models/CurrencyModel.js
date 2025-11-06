const PRICE = 2.5;

class CurrencyModel {
    constructor() {
        
    }


    static tokensToEur(tokenCount) {
        tokenCount * PRICE;
    }
}

module.exports = CurrencyModel;