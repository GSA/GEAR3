import { Router } from "express";
import rateLimit from "express-rate-limit";

import cap from  "./routes/capabilities.routes";
import dataFlow from "./routes/dataflow.routes";
import fisma from "./routes/fisma.routes";
import googleAuth from "./routes/google.routes";
import ldapAPI from "./routes/ldap.routes";
import its from "./routes/it-standards.routes";
import investment from "./routes/investments.routes";
import org from "./routes/organizations.routes";
import poc from "./routes/pocs.routes";
import records from "./routes/records.routes";
import search from "./routes/search.routes";
import serviceCategory from "./routes/website-service-category.routes";
import system from "./routes/systems.routes";
import sysTIME from "./routes/systime.routes";
import techCatalogImport from "./routes/tech-catalog-import.routes";
import techCatalog from "./routes/tech-catalog.routes";
import websites from "./routes/websites.routes";
import techAttributeDefinitions from "./routes/tech-attribute-definitions.routes";
import dataDictionary from "./routes/data-dictionary.routes";

const router = Router();
let limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests
});
router.use(limiter);
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
router.use("/website_service_category", serviceCategory);
router.use("/systems", system);
router.use("/system_time", sysTIME);
router.use("/tech_catalog_import", techCatalogImport);
router.use("/tech_catalog", techCatalog);
router.use("/websites", websites);
router.use("/attribute_definitions", techAttributeDefinitions);
router.use("/data_dictionary", dataDictionary);

export default router;
