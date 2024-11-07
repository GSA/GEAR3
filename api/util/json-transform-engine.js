import jexl from 'jexl';

/**
 * Adds a custom transform to Jexl to convert boolean values to text.
 *
 * @param {boolean} val - The boolean value to convert.
 * @returns {string} 'TRUE' if the value is true, 'FALSE' if the value is false, otherwise an empty string.
 */
jexl.addTransform('convertToText', (val) => val === true ? "TRUE" : val === false ? "FALSE" : "");

/**
 * Adds a custom transform to Jexl to convert a value to a number.
 *
 * @param {*} val - The value to convert.
 * @returns {number} The converted number value.
 */
jexl.addTransform('toNumber', (val) => Number(val));

/**
 * Adds a custom transform to Jexl to convert empty values to null.
 *
 * @param {*} val - The value to check.
 * @returns {null|string} Null if the value is empty, 'None', or only whitespace; otherwise, the original value.
 */
jexl.addTransform('emptyToNull', (val) => !val || val.trim() === '' || val.trim() === 'None' ? null : val);

/**
 * Adds a custom transform to Jexl to convert null values to empty strings.
 *
 * @param {*} val - The value to check.
 * @returns {string} An empty string if the value is null, otherwise the original value.
 */
jexl.addTransform('nullToEmpty', (val) => val === null ? '' : val);

/**
 * Transforms a source JSON object based on a mapping JSON object and an optional context.
 *
 * @param {Object} srcJson - The source JSON object to be transformed.
 * @param {Object} mappingJson - The mapping JSON object that defines how to transform the source JSON.
 * @param {Object} [context={}] - An optional context object to provide additional data for the transformation.
 * @returns {Promise<Object>} A promise that resolves to the transformed JSON object.
 */
export async function transform (srcJson, mappingJson, context = {})  {
  jexlContext = { ...context, ...srcJson };
  destJson = Object.assign({}, ...await Promise.all(Object.keys(mappingJson).flatMap(async (key) => {
    const valExpr = mappingJson[key];
    const value = await jexl.eval(valExpr, jexlContext);
    return { [key]: value };
  })));
  return destJson;
}
