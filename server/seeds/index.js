/* eslint-disable no-console */
const { Seeder } = require('mongo-seeding');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://mongo:27017/pl-finance';

const config = {
    database: DATABASE_URL,
    dropDatabase: true,
};

const seeder = new Seeder(config);

const collections = seeder.readCollectionsFromPath(path.resolve('server/seeds/data'));

seeder
    .import(collections)
    .then(() => {
        console.log('Success!');
    })
    .catch((err) => {
        console.log(err);
    });
