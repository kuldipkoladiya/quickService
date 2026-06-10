const migrateMongo = require('migrate-mongo');
const { logger } = require('./config/logger');

function migrate() {
  migrateMongo.database
    .connect()
    .then(({ db }) => migrateMongo.up(db))
    .catch((error) => {
      logger.error('error in migrate database: ', error);
    })
    .then((migratedItems) => {
      logger.info(`migrated items= ${migratedItems.length}`);
    });
}
module.exports = migrate;
