import jexl from 'jexl';

jexl.addTransform('convertToText', (val) => val === true ? "TRUE" : val === false ? "FALSE" : "");
jexl.addTransform('toNumber', (val) => Number(val));
jexl.addTransform('emptyToNull', (val) => !val || val.trim() === '' || val.trim() === 'None' ? null : val);
jexl.addTransform('nullToEmpty', (val) => val === null ? '' : val);

export async function transform(srcJson, mappingJson, context = {}) {
    jexlContext = { ...context, ...srcJson }

    destJson = Object.assign({}, ...await Promise.all(Object.keys(mappingJson).flatMap(async (key) => {
        const valExpr = mappingJson[key];
        const value = await jexl.eval(valExpr, jexlContext);
        return { [key]: value };
    })));

    return destJson;
}