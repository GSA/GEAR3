const routesPath = './routes/';

const express = require('express');
const app = require(routesPath + 'applications.routes');
const appTIME = require(routesPath + 'apptime.routes');
const cap = require(routesPath + 'capabilities.routes');
const dataFlow = require(routesPath + 'dataflow.routes');
const fisma = require(routesPath + 'fisma.routes');
const its = require(routesPath + 'it-standards.routes');
const investment = require(routesPath + 'investments.routes');
const org = require(routesPath + 'organizations.routes');
const parentSys = require(routesPath + 'parentsystems.routes');
const poc = require(routesPath + 'pocs.routes');
const search = require(routesPath + 'search.routes');

const router = express.Router();

router.use('/applications', app);
router.use('/apptime', appTIME);
router.use('/capabilities', cap);
router.use('/data_flow', dataFlow);
router.use('/fisma', fisma);
router.use('/it_standards', its);
router.use('/investments', investment);
router.use('/organizations', org);
router.use('/parentsystems', parentSys);
router.use('/pocs', poc);
router.use('/search', search);

module.exports = router;
