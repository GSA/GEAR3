import { fileURLToPath  as esmpath} from 'url';
import { dirname as esmdirname} from 'path';

export const __filename = esmpath(import.meta.url);
export const __dirname = esmdirname(__filename);

var dotenv = require('dotenv').config();  // .env Credentials

