const BaseModel = require('../../base/model');
const qident = require('../../utils/qident');

class VendorModel extends BaseModel {
    static tableName = 'Vendors';

    constructor() {
        super();
    }

    /**
     * zoekt vendor met bepaalde userId
     * @param {number} userId
     * @returns Vendor(object) | null
     */
    static async getByUserId(userId) {
        try {
            return await this.findOne({ user_id: userId });
        } catch (err) {
            throw new Error(`Error in ${this.name}.getByUserId: ${err.message}`);
        }
    }

    /**
     * zoekt vendor op id (wrapper; BaseModel kan al een getById hebben)
     * @param {number} id
     * @returns Vendor(object) | null
     */
    static async getById(id) {
        try {
            return await super.getById(id);
        } catch (err) {
            throw new Error(`Error in ${this.name}.getById: ${err.message}`);
        }
    }

    /**
     * Maakt nieuwe vendor aan voor gebruiker (optioneel enkel 1 vendor per user)
     * @param {number} userId
     * @param {string} name
     * @param {string|null} location
     * @param {number|null} longitude
     * @param {number|null} latitude
     * @param {boolean} allowMultiplePerUser (default false)
     * @returns Vendor(object)
     */
    static async createForUser(
        userId,
        name,
        location = null,
        longitude = null,
        latitude = null,
        allowMultiplePerUser = false
    ) {
        if (!name || typeof name !== 'string') {
            throw new Error('Vendor name is required and must be a string');
        }

        try {
            if (!allowMultiplePerUser) {
                const existing = await this.getByUserId(userId);
                if (existing) {
                    throw new Error(`Vendor already exists for user ${userId}`);
                }
            }

            return await this.create({
                user_id: userId,
                name,
                location,
                longitude,
                latitude,
            });
        } catch (err) {
            throw new Error(`Error in ${this.name}.createForUser: ${err.message}`);
        }
    }

    /**
     * Update vendor gegevens
     * @param {number} vendorId
     * @param {object} fields - object met velden om te updaten: { name, location, longitude, latitude }
     * @returns Vendor(object) | null
     */
    static async updateVendor(vendorId, fields = {}) {
        try {
            const vendor = await this.getById(vendorId);
            if (!vendor) {
                throw new Error(`Vendor not found with id ${vendorId}`);
            }

            // filter alleen toegestane velden
            const allowed = ['name', 'location', 'longitude', 'latitude', 'user_id'];
            const payload = {};
            for (const k of allowed) {
                if (k in fields) payload[k] = fields[k];
            }

            return await this.update(vendorId, payload);
        } catch (err) {
            throw new Error(`Error in ${this.name}.updateVendor: ${err.message}`);
        }
    }

    /**
     * Zet of update locatie coördinaten voor vendor
     * @param {number} vendorId
     * @param {number} longitude
     * @param {number} latitude
     * @returns Vendor(object) | null
     */
    static async setLocation(vendorId, longitude, latitude) {
        if (typeof longitude !== 'number' || typeof latitude !== 'number') {
            throw new Error('longitude and latitude must be numbers');
        }

        try {
            const vendor = await this.getById(vendorId);
            if (!vendor) {
                throw new Error(`Vendor not found with id ${vendorId}`);
            }

            return await this.update(vendorId, {
                longitude,
                latitude,
            });
        } catch (err) {
            throw new Error(`Error in ${this.name}.setLocation: ${err.message}`);
        }
    }

    /**
     * Verwijdert vendor (soft/hard afhankelijk van BaseModel.delete)
     * @param {number} vendorId
     * @returns boolean
     */
    static async deleteVendor(vendorId) {
        try {
            const vendor = await this.getById(vendorId);
            if (!vendor) {
                throw new Error(`Vendor not found with id ${vendorId}`);
            }

            // veronderstelt dat BaseModel.delete bestaat en true/false teruggeeft
            return await this.delete(vendorId);
        } catch (err) {
            throw new Error(`Error in ${this.name}.deleteVendor: ${err.message}`);
        }
    }

    /**
     * geeft vendor data terug met user info (summary)
     * @param {number} vendorId
     * @returns object | null
     */
    static async getSummary(vendorId) {
        const sql = `
            SELECT
                v.*,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role
            FROM ${qident(this._tableName())} v
            LEFT JOIN ${qident('Users')} u ON v.user_id = u.id
            WHERE v.id = ?
        `;

        try {
            const row = await this._db().get(sql, [vendorId]);
            return row || null;
        } catch (err) {
            throw new Error(`Error in ${this.name}.getSummary: ${err.message}`);
        }
    }

    /**
     * Zoekt vendors op naam (LIKE)
     * @param {string} term
     * @param {number} limit
     * @returns Array<Vendor>
     */
    static async searchByName(term, limit = 20) {
        const sql = `
            SELECT *
            FROM ${qident(this._tableName())}
            WHERE name LIKE ?
            LIMIT ?
        `;
        try {
            const rows = await this._db().all(sql, [`%${term}%`, limit]);
            return rows || [];
        } catch (err) {
            throw new Error(`Error in ${this.name}.searchByName: ${err.message}`);
        }
    }
}

module.exports = VendorModel;
