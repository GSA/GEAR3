import { Router } from "express";
import { findAll, findOne, findScans, findOneScan, findServiceCategories, findSystems, updateSystems } from "../controllers/websites.controller";

const router = Router();

router.route("/").get(findAll);

router.route("/get/:id").get(findOne);

router.route("/get/:id/scans").get(findScans);

router.route("/get/:id/scans/:scanId").get(findOneScan);

router
  .route("/get/:id/service_categories")
  .get(findServiceCategories);

router.route("/get/:id/systems").get(findSystems);

router.route("/updateSystems/:id").put(updateSystems);

export default router;
