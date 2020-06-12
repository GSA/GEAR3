const routesPath = './routes/';

const express = require('express');
const app = require(routesPath + 'applications.routes');
const appTIME = require(routesPath + 'apptime.routes');
const cap = require(routesPath + 'capabilities.routes');
const fisma = require(routesPath + 'fisma.routes');
const its = require(routesPath + 'it-standards.routes');
// const interfaces = require('./interface');
// const interfacesv2 = require('./interfacev2');
const investment = require(routesPath + 'investments.routes');
const org = require(routesPath + 'organizations.routes');
const parentSys = require(routesPath + 'parentsystems.routes');
const poc = require(routesPath + 'pocs.routes');
// const mng = require('./managerpage');
// const search = require('./search');

const router = express.Router();

router.use('/applications', app);
router.use('/apptime', appTIME);
router.use('/capabilities', cap);
router.use('/fisma', fisma);
router.use('/it_standards', its);
// router.use('/interfaces', interfaces);
// router.use('/interfacesv2', interfacesv2);
router.use('/investments', investment);
router.use('/organizations', org);
router.use('/parentsystems', parentSys);
router.use('/pocs', poc);
// router.use('/managerpage', mng);
// router.use('/search', search);

module.exports = router;
