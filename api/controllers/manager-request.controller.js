const ctrl = require('./base.controller');

exports.create = (req, res) => {
  var data = req.body;

  var query = `INSERT INTO obj_registration(
    FirstName,
    LastName,
    Email,
    OrgCode,
    SupervisorEmail,
    BusinessNeed) VALUES (
      '${data.mngrFirstName}',
      '${data.mngrLastName}',
      '${data.mngrEmail}',
      '${data.mngrOrgCode}',
      '${data.supervisorEmail}',
      '${data.bizNeed}');`;

  res = ctrl.sendQuery(query, 'create GEAR Manager request', res);
};