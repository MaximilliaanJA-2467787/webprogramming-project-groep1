const Database = require('../database');

class BaseModel {
    constructor(tabelname, db) {
        this.tableName = tabelname;
        this.db = db;
    }


    async getById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;

        try{
            const result = await this.db.get(sql, [id]);
            return result || null;
        } catch (error) {
            throw new Error(`Fout bij ophalen records: ${error.message}`);
        }
    }

    
    async getAll(conditions = {}, options = {}){
        let sql = `SELECT * FROM ${this.tableName}`;
        const params = [];

        // toevoegen filter condities, als die er zijn
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(` AND `);

            sql += ` WHERE ${whereClause}`;

            params.push(Object.values(conditions));
        }

        // toevoegen opties order by en de direction
        if (options.orderBy) {
            sql += ` ORDER BY ${options.orderBy}`;

            if (options.orderDirections) {
                sql += ` ${options.orderDirections}`;
            }
        }

        try{
            return await this.db.all(sql, params);
        } catch (error) {
            throw new Error(`Fout bij ophalen records: ${error.message}`);
        }   

    }

    // aanmaken van niew record in database
    async create(data) {
        const keys = Object.keys(data);
        const values = Object.values(data);

        const placeholders = keys.map(() => `?`).join(`, `);

        const sql = `INSERT INTO ${this.tableName} (${keys.join(`, `)}) VALUES (${placeholders})`;

        try{
            const result = await this.db.run(sql, values);

            return await this.getById(result.id)
        } catch (error) {
            throw new Error(`Fout bij ophalen records: ${error.message}`);
        }

    }
}
