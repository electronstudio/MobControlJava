/**
 * MobControl Client
 *
 * Stores and updates internal representation of a pad based on user interaction.
 * Transmits internal representation to server on regular intervals.
 */

import PadPage from './pages/pad.js';
import Conn from './lib/conn.js';
import Logger from './lib/logger.js';

const logElement = document.getElementById('log');
const logger = new Logger(logElement);

const conn = new Conn();
const padPage = new PadPage(conn, logger);
export default padPage;
