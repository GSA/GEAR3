import { Router } from "express";
import { findAll, findOne, findRelatedWebsites } from "../controllers/website-service-category.controller";

const router = Router();

router.route("/").get(findAll);
router.route("/get/:id").get(findOne);
router
  .route("/get/:id/websites")
  .get(findRelatedWebsites);

export default router;
