const routesPath = "./routes/";

const express = require("express");
const cap = require(routesPath + "capabilities.routes");
const dataFlow = require(routesPath + "dataflow.routes");
const fisma = require(routesPath + "fisma.routes");
const googleAuth = require(routesPath + "google.routes");
const ldapAPI = require(routesPath + "ldap.routes");
const its = require(routesPath + "it-standards.routes");
const investment = require(routesPath + "investments.routes");
const org = require(routesPath + "organizations.routes");
const poc = require(routesPath + "pocs.routes");
const records = require(routesPath + "records.routes");
const search = require(routesPath + "search.routes");
const serviceCategory = require(routesPath + "service-category.routes");
const system = require(routesPath + "systems.routes");
const sysTIME = require(routesPath + "systime.routes");
const websites = require(routesPath + "websites.routes");

const router = express.Router();

router.use("/capabilities", cap);
router.use("/data_flow", dataFlow);
router.use("/fisma", fisma);
router.use("/googleAuth", googleAuth);
router.use("/ldap", ldapAPI);
router.use("/it_standards", its);
router.use("/investments", investment);
router.use("/organizations", org);
router.use("/pocs", poc);
router.use("/records", records);
router.use("/search", search);
router.use("/service_category", serviceCategory);
router.use("/systems", system);
router.use("/system_time", sysTIME);
router.use("/websites", websites);

module.exports = router;
