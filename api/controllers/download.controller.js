const converter = require('json-2-csv');

const convertMultiLineValues = (jsonObj) => {
  return Object.fromEntries(
    Object.entries(jsonObj).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.replace(/\n/g, ' ') : value
    ])
  );
};

const preprocessData = (data, fields = []) => {
  return fields && fields.length > 0 ?
    data.map(item => convertMultiLineValues(item)) : data;
}

const covertCsv = async (jsonData, fields) => {
  const preprocessedData = preprocessData(jsonData, fields);
  console.log(preprocessedData);
  const csv = await converter.json2csv(preprocessedData, { keys: fields, delimiter: { wrap: '"' } })
  return csv;
}

exports.downloadCsv = async (req, res) => {
  const reqBody = req.body;
  const jsonData = reqBody.data;
  const fields = reqBody.fields;
  const name = reqBody.name;

  const csv = await covertCsv(jsonData, fields);

  res.header('Content-Type', 'text/csv');
  res.attachment(name);
  res.send(csv);
};