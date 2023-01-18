const express = require("express");
const websiteServiceCategoryCtrl = require("../controllers/website-service-category.controller");

const router = express.Router();

router.route("/").get(websiteServiceCategoryCtrl.findAll);
router.route("/get/:id").get(websiteServiceCategoryCtrl.findOne);
router
  .route("/get/:id/websites")
  .get(websiteServiceCategoryCtrl.findRelatedWebsites);

module.exports = router;
