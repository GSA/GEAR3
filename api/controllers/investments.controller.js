const ctrl = require('./base.controller');

const fs = require('fs');
const path = require('path');

const queryPath = '../queries/';

function findAll(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_investments.sql')).toString() +
    ";";

  res = ctrl.sendQuery(query, 'investments', res);
};

function findOne(req, res, next) {
  if (req.params.id === 'types') {
    next()
  } else {
    var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_investments.sql')).toString() +
      ` WHERE invest.Id = ${req.params.id};`;

    res = ctrl.sendQuery(query, 'individual investment', res);
  }
};

function findTypes(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_investment_types.sql')).toString();

  res = ctrl.sendQuery(query, 'investment types', res)
}

function findApplications(req, res) {
  var query = fs.readFileSync(path.join(__dirname, queryPath, 'GET/get_applications.sql')).toString() +
    ` AND app.obj_investment_Id = ${req.params.id} GROUP BY app.Id;`;  // Note that there's already a WHERE clause

  res = ctrl.sendQuery(query, 'application relations for investment', res);
};

function update(req, res) {
  if (req.headers.authorization) {
    var data = req.body;
    var query = `UPDATE obj_investment
      SET Keyname               = '${data.investName}',
        Active                  = ${data.investStatus},
        Description             = '${data.investDesc}',
        obj_poc_Id              = ${data.invManager},
        obj_investment_type_Id  = ${data.investType},
        Budget_Year             = '${data.investBY}',
        UII                     = '${data.investUII}',
        obj_organization_Id     = ${data.investSSO},
        primary_service_area    = '${data.investPSA}',
        sec_serv_area1          = '${data.investSSA}',
        Comments                = '${data.investComments}'
      WHERE Id = ${req.params.id}`

    res = ctrl.sendQuery(query, 'update investment', res);
  }
}

module.exports = {
  findAll,
  findOne,
  findTypes,
  findApplications,

  update
};