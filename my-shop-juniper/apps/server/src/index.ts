import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';
// can delete this comment-- it was added so CICD picks up code changes
runMigrations(config)
    .then(() => bootstrap(config))
    .catch(err => {
        console.log(err);
    });
