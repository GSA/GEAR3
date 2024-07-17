const jexl = require('jexl')

jexl.addTransform('convertToText', (val) => val === true? "TRUE": val === false ? "FALSE":"")
jexl.addTransform('toNumber', (val) => Number(val))

exports.transform = async (srcJson, mappingJson, context = {}) => {
    jexlContext = {...context, ...srcJson}

    destJson = Object.assign({}, ...await  Promise.all(Object.keys(mappingJson).flatMap(async (key) => {
        const valExpr = mappingJson[key];
        const value = await jexl.eval(valExpr, jexlContext);
        return {[key]: value ? value: ""};
    })));

    return destJson;
};