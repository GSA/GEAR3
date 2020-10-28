const ctrl = require('./base.controller'),
  nodemailer = require("nodemailer"),
  eaEmail = 'ea_planning@gsa.gov';


var transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: process.env.SMTP_PORT,
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});


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


exports.sendEmail = (req, res) => {
  console.log("GEAR Manager request came");
  let mngrData = req.body;

  const mailOptions = {
    from: `"GEAR", "${eaEmail}"`,
    to: `${eaEmail}`,
    subject: "New GEAR Manager Request Received",
    html: `
    <p>Hi EA Team,</p>

    <p>A new GEAR manager request was sent via the form on GEAR. Please review the information provided 
    by the requestor below and approve or reject the request.</p>
    <ul>
      <li>Name: ${mngrData.mngrFirstName} ${mngrData.mngrLastName}</li>
      <li>Email: ${mngrData.mngrEmail}</li>
      <li>Org: ${mngrData.mngrOrgCode}</li>
      <li>Supervisor's Email: ${mngrData.supervisorEmail}</li>
      <li>Business Need: ${mngrData.bizNeed}</li>
    </ul>
    <br>
    
    <div>
      <a title="Approve Button" href="${req.get('hostname')}/#/manager_request?page=accept&requestor=${mngrData.mngrFirstName} ${mngrData.mngrLastName}&email=${mngrData.mngrEmail}" target="_blank" rel="noopener">Approve</a>&nbsp; &nbsp; 
      <a title="Reject Button" href="${req.get('hostname')}/#/manager_request?page=reject&requestor=${mngrData.mngrFirstName} ${mngrData.mngrLastName}&email=${mngrData.mngrEmail}" target="_blank" rel="noopener">Reject</a>
    </div>
    <br>

    <p>Have a great day!<br>GEAR</p>`
  };

  res = send(mailOptions, res);
};


exports.accept = (req, res) => {
  let data = req.body;
  console.log(data);

  var query = `UPDATE obj_registration
    SET Approved = 1
    WHERE Email = '${data.email}';`;

  ctrl.sendQuery(query, 'accept GEAR Manager request', res);

  const mailOptions = {
    from: `"GEAR", "${eaEmail}"`,
    to: `${data.email}`,
    subject: "GEAR Manager Request Accepted",
    html: `
    <p>Hi ${data.name},</p>

    <p>Your request for GEAR Manager access has been approved. You should now have access to GEAR manager through GEAR.
    Feel free to reply to this email if you have any questions or difficulties.</p>

    <p>Have a great day!<br>GEAR</p>`
  };

  res = send(mailOptions, res);
};


exports.reject = (req, res) => {
  let data = req.body;

  var query = `UPDATE obj_registration
    SET Approved = 0
    WHERE Email = '${data.email}';`;

  res = ctrl.sendQuery(query, 'reject GEAR Manager request', res);

  const mailOptions = {
    from: `"GEAR", "${eaEmail}"`,
    to: `${data.email}`,
    subject: "GEAR Manager Request Rejected",
    html: `
    <p>Hi ${data.name},</p>

    <p>Your request for GEAR Manager access has been rejected due to not enough business need or another reason.
    Feel free to reply to this email if you have any questions.</p>

    <p>Regards,<br>GEAR</p>`
  };

  res = send(mailOptions, res);
};


function send(mailOptions, response) {
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      response.status(400);
      response.send({ error: "Failed to send email" });
    } else {
      console.log("Email has been sent");
    }
  });

  return response
};