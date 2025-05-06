import { camelCase, mapKeys } from 'lodash-es';

const adminUserIdsSet = new Set(JSON.parse(process.env.ADMIN_USER_IDS || '[]'));
const MAX_PG_INT = 2147483647;

function removeHttpFromUrl(url: string) {
  return url.replace(/^https?:\/\//, '');
}

export function prettyEncodeTitle(title: string): string {
  return title.toLowerCase().split(" ").join("-").replace(/\`|\~|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\+|\=|\–|\[|\{|\]|\}|\||\\|\'|\<|\,|\>|\?|\/|\”|\“|\"|\’|\;|\:|\.|\_|\s/g, '').replace(/-{2,}/g, '-')
}

const arrayToArrayObject = (array: any[], keyField: string): Record<string, any[]> =>
  array.reduce((obj, item) => {
    const valueAtKey = obj[item[keyField]]
    if (!valueAtKey){
      obj[item[keyField]] = [item];
    }else{
      obj[item[keyField]] = [ ...valueAtKey, item]
    }
    return obj;
  }, {});

const arrayToArrayObjectAtProperty = (array: any[], keyField: string, value: string): Record<string, any[]> =>
  array.reduce((obj, item) => {
    const valueAtKey = obj[item[keyField]]
    if (!valueAtKey){
      obj[item[keyField]] = [item[value]];
    }else{
      obj[item[keyField]] = [ ...valueAtKey, item[value]]
    }
    return obj;
  }, {});

export function convertToCamelCase(object: Record<string, any>): Record<string, any> {
  return mapKeys(object, (_, key) => camelCase(key));
}

function truncate(str: string, n: number): string {
  return (str.length > n) ? str.substr(0, n-4) + '...' : str;
}

export function safeStringValue(text?: string, limit = 255): string | null {
  if (!text) { return null }
  return truncate(text, limit)
}

export function safeFormattedNumber(number?: string, defaultValue?: number | null): number | null {
  if (!number) return null;
  
  const parsedNumber = Number(number);
  if (isNaN(parsedNumber) || parsedNumber <= 0 || parsedNumber > MAX_PG_INT) {
    return defaultValue || null;
  }
  return Math.floor(parsedNumber);
}

export function safeObjProperties(obj?: Record<string, any>, limit = 2000): Record<string, any> | null {
  if (!obj) { return null }
  const values = Object.values(obj)
  const keys = Object.keys(obj)
  
  const keysAndValues = [...keys, ...values]
  const isUnderLimit = keysAndValues.every(item => item.length < limit)

  if (!isUnderLimit) { throw new Error('safeObjProperties: value or key is over character limits') }
  return obj
}

export function safeObjWithVariantKeys(objAsString: string | null, variantKeys: string[] = [], limit = 2000): Record<string, any> | null {
  if (!objAsString) { return null }

  const obj = JSON.parse(objAsString)

  //throw error if value or key is over character limit
  safeObjProperties(obj, limit)

  const variantKeysSet = new Set(variantKeys)
  const keys = Object.keys(obj)
  const hasInvalidKey = keys.some(key => !variantKeysSet.has(key))
  if (hasInvalidKey) { throw new Error('safeObjWithVariantKeys: key is not in allowed variantKeys') }
  return obj
}

export function convertTextToBoolean(value?: string): boolean {
  if (!value) return false
  const lowercaseValue = value.toString().toLowerCase().trim()
  return lowercaseValue === 'yes' || lowercaseValue === 'true'
} 

export function safeArrayProperties(array: any[], limit = 2000): any[] | null {
  if (!array) { return null }
  return array.filter(item => item.length < limit)
}