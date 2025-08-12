const express = require("express");
const cloudAdoptionRateCtrl = require("../controllers/cloud-adoption-rate.controller");

const router = express.Router();

router.route("/").get(cloudAdoptionRateCtrl.findAll);

module.exports = router;