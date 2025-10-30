const BaseModel = require('../../base/model');
const qident = require('../../utils/qident');

class WalletModel extends BaseModel {
    static tablename = 'Wallets';
    constructor() {}

    /**
     * zoekt wallet met bepaalde userId
     * @param {number} userId
     * @returns Wallet(object) | null
     */
    static async getByUserId(userId) {
        try {
            return await this.findOne({ user_id: userId });
        } catch (err) {
            throw new Error(`Error in ${this.name}.getByUserId: ${err.message}`);
        }
    }

    /**
     * Maakt nieuwe wallet aan voor gebruiker als die wallet nog niet bestaat
     * @param {number} userId
     * @param {string} currency => 'EUR', 'USD', ...
     * @returns Wallet(object) | null
     */
    static async createForUser(userId, currency = 'EUR') {
        try {
            const existing = await this.getByUserId(userId);

            if (existing) {
                throw new Error(`Wallet already exists for user ${userId}`);
            } else {
                return await this.create({
                    user_id: userId,
                    balance_tokens: 0,
                    currency: currency,
                });
            }
        } catch (err) {
            throw new Error(`Error in ${this.name}.createForUser: ${err.message}`);
        }
    }

    /**
     * zoekt balance van wallet met meegegeven userId
     * @param {number} userId
     * @returns WalletBalance
     */
    static async getBalance(userId) {
        try {
            const wallet = this.getByUserId(userId);
            return wallet ? parseFloat(wallet.balance_tokens) : 0;
        } catch (err) {
            throw new Error(`Error in ${this.name}.getBalance: ${err.message}`);
        }
    }

    /**
     * toevoegen tokens bij user met meegegeven userId
     * doet alleen bijvullen, niet aftrekken
     * @param {number} userId
     * @param {number} amountTokens
     * @returns Wallet(object) | null
     */
    static async addTokens(userId, amountTokens) {
        if (amountTokens <= 0) {
            throw new Error('amount must be positive!');
        }

        try {
            const wallet = await this.getByUserId(userId);
            if (!wallet) {
                throw new Error(`Wallet not found for user ${userId}`);
            }

            const newBalance = parseFloat(wallet.balance_tokens) + parseFloat(amountTokens);
            return await this.update(wallet.id, {
                balance_tokens: newBalance,
            });
        } catch (err) {
            throw new Error(`Error in ${this.name}.addTokens: ${err.message}`);
        }
    }

    /**
     * aftrekken tokens bij user met meegegeven userId
     * doet alleen aftrekken, niet toevoegen
     * @param {number} userId
     * @param {number} amountTokens
     * @returns Wallet(object) | null
     */
    static async removeTokens(userId, amountTokens) {
        if (amountTokens <= 0) {
            throw new Error('amount must be positive!');
        }

        try {
            const wallet = await this.getByUserId(userId);
            if (!wallet) {
                throw new Error(`Wallet not found for user ${userId}`);
            }

            const currentBalance = parseFloat(wallet.balance_tokens);
            if (currentBalance < amountTokens) {
                throw new Error(`Insufficient balance: ${currentBalance} < ${amount}`);
            }

            const newBalance = currentBalance - parseFloat(amountTokens);
            return await this.update(wallet.id, {
                balance_tokens: newBalance,
            });
        } catch (err) {
            throw new Error(`Error in ${this.name}.addTokens: ${err.message}`);
        }
    }

    /**
     * gaat een transfer verrichten van user naar andere user met een meegegeven hoeveelheid van tokens
     * @param {number} sourceUserId
     * @param {number} destinationUserId
     * @param {number} amount
     * @returns sourceWallet en destinationWallet met nieuwe balance
     */
    static async transfer(sourceUserId, destinationUserId, amount) {
        if (amount <= 0) {
            throw new Error(`Amount must be positive`);
        }
        if (sourceUserId === destinationUserId) {
            throw new Error(`Cannot tranfer to yourself`);
        }

        try {
            const sourceWallet = await this.getByUserId(sourceUserId);
            const destinationWallet = await this.getByUserId(destinationUserId);

            if (!sourceWallet) {
                throw new Error(`Source wallet not found for user ${sourceUserId}`);
            }
            if (!destinationWallet) {
                throw new Error(`destination wallet not found for user ${destinationUserId}`);
            }

            const sourceBalance = parseFloat(sourceWallet.balance_tokens);
            if (sourceBalance < amount) {
                throw new Error(`Insufficient balance: ${sourceBalance} < ${amount}`);
            }

            const executeTransfer = this._db().transaction(() => {
                const newSourceBalance = sourceBalance - parseFloat(amount);
                this._db().run(
                    `UPDATE ${qident(this._tableName())} SET balance_tokens = ? WHERE id = ?`,
                    [newSourceBalance, sourceWallet.id]
                );

                const destinationBalance = parseFloat(destinationWallet.balance_tokens);
                const newdestBalance = destinationBalance + parseFloat(amount);
                this._db().run(
                    `UPDATE ${qident(this._tableName())} SET balance_tokens = ? WHERE id = ?`,
                    [newdestBalance, destinationWallet.id]
                );
            });

            executeTransfer();

            return {
                source: await this.getById(sourceWallet.id),
                destination: await this.getById(destinationWallet.id),
            };
        } catch (err) {
            throw new Error(`Error in ${this.name}.transfer: ${err.message}`);
        }
    }

    /**
     * functie is alleen bedoeld voor admin users
     * zet balance van user naar de meegegeven balance
     * @param {number} userId
     * @param {number} newBalance
     * @returns Wallet(object) | null
     */
    static async setBalance(userId, newBalance) {
        if (newBalance < 0) {
            throw new Error(`Balance cannot be negative`);
        }

        try {
            const wallet = await this.getByUserId(userId);
            if (!wallet) {
                throw new Error(`Wallet not found for user ${userId}`);
            }

            return await this.update(wallet.id, {
                balance_tokens: newBalance,
            });
        } catch (err) {
            throw new Error(`Error in ${this.name}.setBalance: ${err.message}`);
        }
    }
}
