import knex from 'knex';
import config from './config.js';

export const database = knex(config)

export * from "./types.js";