import fs from 'node:fs/promises';

const databasePath = new URL('../db.json', import.meta.url);

export class Database {
    #database = {};

    constructor() {
        fs.readFile(databasePath, 'utf-8')
            .then(data => {
                this.#database = JSON.parse(data);
            })
            .catch(() => {
                this.#persist();
            });
    }

    async #persist() {
        await fs.writeFile(databasePath, JSON.stringify(this.#database, null, 2));
    }

    select(table, search) {
        let data = this.#database[table] ?? [];

        if (typeof search === 'function') {
            data = data.filter(search);
        } else if (search) {
            data = data.filter(row =>
                Object.entries(search).some(([key, value]) =>
                    row[key]?.toString().toLowerCase().includes(value.toString().toLowerCase())
                )
            );
        }

        return data;
    }

    async insert(table, data) {
        if (Array.isArray(this.#database[table])) {
            this.#database[table].push(data);
        } else {
            this.#database[table] = [data];
        }
        await this.#persist();
        return data;
    }

    async delete(table, id) {
        const rowIndex = this.#database[table]?.findIndex(row => row.id === id);
        if (rowIndex > -1) {
            this.#database[table].splice(rowIndex, 1);
            await this.#persist();
        }
    }

    async update(table, id, data) {
        const rowIndex = this.#database[table]?.findIndex(row => row.id === id);
        if (rowIndex > -1) {
            this.#database[table][rowIndex] = {
                ...this.#database[table][rowIndex],
                ...data
            };
            await this.#persist();
        }
    }
}