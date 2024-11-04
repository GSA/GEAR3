import { createClient } from 'ldapjs';
import { ifError } from 'assert';

var creds = {
  url: process.env.LDAP_ADDR,
  reconnect: true,
  bindDN: "DC=ent,DC=ds,DC=gsa,DC=gov"
};
var opts = {
  scope: 'sub',
  attributes: ['SamAccountName', 'GivenName', 'sn', 'mail', 'OfficePhone', 'Division', 'Title', 'employeeType', 'Enabled']
};

export function check(req, res) {
  var ldapClient = createClient(creds);
  opts.filter = `&(ObjectCategory=user)(ObjectClass=Person)(givenName=${req.params.first_name})(sn=${req.params.last_name})`

  res = authDN(ldapClient, searchUser, res);
}

//binding
function authDN(client, cb, res) {
  client.bind(process.env.LDAP_USER, process.env.LDAP_PASS, function (err) {
    cb(res, err, client);
  });
}

function searchUser(res, err, client) {
  client.search(creds.bindDN, opts, function (err, response) {
    ifError(err);
    var body = [];

    response.on('searchEntry', function (entry) {
      // console.log('entry: ' + JSON.stringify(entry.object));  // Debug
      body.push(entry.object);
      client.destroy();
    });
    response.on('searchReference', function (referral) {
      // console.log('referral: ' + referral.uris.join());  // Debug
    });
    response.on('error', function (err) {
      console.error('error: ' + err.message);
      res.status(503).json({
        message:
        err.message || `LDAP match not found`
      });
    });
    response.on('end', function (result) {
      // Debug
      // console.log('status: ' + result.status);
      // console.log('result: ' + result);
      // console.log(body);
      res.status(200).json(body);
    });
  });
}
