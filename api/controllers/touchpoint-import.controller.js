const { equal } = require('assert');
var dotenv = require('dotenv').config();  // .env Credentials

const https = require('https'),
  fs = require("fs"),
  path = require("path"),
  queryPath = "../queries/",
  mappingsPath = "../json-mappings/",
  jsonTransformEngine = require("../util/json-transform-engine.js"),
  isEqual = require('lodash.isequal'),
  jsonDiff = require('json-diff');

const sql_promise = require("../db.js").connection_promise;

const apiKey = process.env.TOUCHPOINT_API_KEY;
const touchpointHost = "api.gsa.gov";
const touchpointUrlPath = `/analytics/touchpoints/v1/websites.json?all=1&API_KEY=${apiKey}`;

const insert_params = ["cms_platform", "contact_email", "dap_gtm_code", "digital_brand_category", "domain", "feedback_tool", "has_authenticated_experience", "has_dap", "has_search", "hosting_platform", "https", "id", "mobile_friendly", "notes", "office", "production_status", "redirects_to", "repository_url", "required_by_law_or_policy", "site_owner_email", "sitemap_url", "status_code", "sub_office", "type_of_site", "uses_feedback", "uses_tracking_cookies", "uswds_version"];

const update_params = ["cms_platform", "contact_email", "dap_gtm_code", "digital_brand_category", "domain", "feedback_tool", "has_authenticated_experience", "has_dap", "has_search", "hosting_platform", "https", "id", "mobile_friendly", "notes", "office", "production_status", "redirects_to", "repository_url", "required_by_law_or_policy", "site_owner_email", "sitemap_url", "status_code", "sub_office", "type_of_site", "uses_feedback", "uses_tracking_cookies", "uswds_version", "id"];


const doRequest = (options) => {
  return new Promise((resolve, reject) => {
    let req = https.request(options);

    req.on('response', res => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      });
    });

    req.on('error', err => {
      reject(err);
    });

    req.end();
  });
}

const getData = async () => {
  const options = {
    host: touchpointHost,
    path: touchpointUrlPath,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return await doRequest(options);
}

const runQuery = async (query, values) => {
  [rows, fields] = await sql_promise.query(query, values);
  return rows;
};

const getDbData = async () => {
  const query = fs.readFileSync(path.join(__dirname, queryPath, "GET/get_touchpoint_websites.sql")).toString();
  return await runQuery(query);
};

const insertDbData = async (rowData) => {
  const query = fs.readFileSync(path.join(__dirname, queryPath, "CREATE/insert_websites_from_touchpoint.sql")).toString();
  const values = insert_params.map(paramName => rowData[paramName]);
  const result = await runQuery(query, values);
  //console.log(`Insert::: id: ${rowData.id}, row: ${JSON.stringify(result)}`);
};

const updateDbData = async (rowData) => {
  const query = fs.readFileSync(path.join(__dirname, queryPath, "UPDATE/update_websites_from_touchpoint.sql")).toString();
  const values = update_params.map(paramName => rowData[paramName]);
  const result = await runQuery(query, values);
  //console.log(`Update::: id: ${rowData.id}, result: ${JSON.stringify(result)}`);
};

const removeDbData = async (rowIds) => {
  const query = fs.readFileSync(path.join(__dirname, queryPath, "REMOVE/remove_websites_by_ids.sql")).toString();
  const result = await runQuery(query, [rowIds]);
  //console.log(`Remove rows::: result: ${JSON.stringify(result)}`);
};

const analyzeData = async (dataItems) => {
  // get touch point data for comparison
  const mappingsJson = JSON.parse(fs.readFileSync(path.join(__dirname, mappingsPath, "touchpoint-to-website.json")));
  const touchpointDbRows = await Promise.all(dataItems
    .filter(dataItem => dataItem["attributes"]["organization_id"] === 1)
    .map(async (dataItem) => await jsonTransformEngine.transform(dataItem, mappingsJson)));
  const touchpointRowMap = Object.assign({}, ...touchpointDbRows.map(row => { return { [row.id]: row } }));
  touchpointDbRows.sort((a, b) => a.id - b.id);

  const dbRows = await getDbData();
  const dbRowMap = Object.assign({}, ...dbRows.map(row => { return { [row.id]: row } }));

  console.log(`Total touchpoint count: ${touchpointDbRows.length}`);
  console.log(`Total db count: ${dbRows.length}`);

  updateIds = Object.keys(dbRowMap).filter(dbId => (dbId in touchpointRowMap) && !isEqual(dbRowMap[dbId], touchpointRowMap[dbId]));
  console.log("Update count: " + updateIds.length);
  //print data differences
  updateIds.forEach(id => console.log(`Update::: id: ${id}, diff: ${jsonDiff.diffString(dbRowMap[id], touchpointRowMap[id])}`));
  console.log(`Update Count: ${updateIds.length}`);
  //console.log(`Update Ids: ${JSON.stringify(updateIds)}`);


  newIds = Object.keys(touchpointRowMap).filter(dbId => !(dbId in dbRowMap))
  console.log(`New Count: ${newIds.length}`);
  //console.log(`New Ids: ${JSON.stringify(newIds)}`);

  removeIds = Object.keys(dbRowMap).filter(dbId => !(dbId in touchpointRowMap))
  console.log(`Remove Count: ${removeIds.length}`);
  //console.log(`Remove Ids: ${JSON.stringify(removeIds)}`);

  return [newIds, updateIds, removeIds]
};

const transformTouchpointData = async (tpDataItems, mappingFileName, filterIds=[]) => {
  // get complete touch point data json for import
  const mappingsCompleteJson = JSON.parse(fs.readFileSync(path.join(__dirname, mappingsPath, mappingFileName)));
  return await Promise.all(tpDataItems
    .filter(dataItem => dataItem["attributes"]["organization_id"] === 1 &&
      (filterIds.length === 0 || filterIds.indexOf(dataItem.id) !== -1))
    .map(async (dataItem) => await jsonTransformEngine.transform(dataItem, mappingsCompleteJson)));
}

const createData = async (tpDataItems, rowIds) => {
  if (!rowIds || rowIds.length === 0) {
    console.log(`${new Date()}: no new items.`)
    return;
  }
  const tpDataRows = await transformTouchpointData(tpDataItems, "touchpoint-to-website-complete.json", rowIds);
  console.log(`new row count ${tpDataRows.length}`);
  await Promise.all(tpDataRows.map(async (rowData) => await insertDbData(rowData)));
  console.log(`${new Date()}: Insertion is complete.`);
};

const updateData = async (tpDataItems, rowIds) => {
  if (!rowIds || rowIds.length === 0) {
    console.log(`${new Date()}: no update items.`)
    return;
  }
  const tpDataRows = await transformTouchpointData(tpDataItems, "touchpoint-to-website-complete.json", rowIds);
  console.log(`${new Date()}: update row count ${tpDataRows.length}`);
  await Promise.all(tpDataRows.map(async (rowData) => await updateDbData(rowData)));
  console.log(`${new Date()}: Update is complete.`);
};

const removeData = async (rowIds) => {
  if (!rowIds || rowIds.length === 0) {
    console.log(`${new Date()}: no remove items.`)
    return;
  }
  console.log(`${new Date()}: delete row count ${rowIds.length}`);
  await removeDbData(rowIds);
  console.log(`${new Date()}: Delete is complete.`);
};

exports.importWebsiteData = async () => {
  const tpDataObj = await getData();
  const tpDataItems = tpDataObj["data"];

  const [newIds, updateIds, removeIds] = await analyzeData(tpDataItems);
  await createData(tpDataItems, newIds);
  await updateData(tpDataItems, updateIds);
  await removeData(removeIds);
}
