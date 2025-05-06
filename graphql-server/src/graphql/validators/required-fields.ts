import { Kind } from 'graphql';
import { get } from 'lodash-es';
import { ValidationError } from "../error.js";

const objectMap = (obj: any, fn: any) =>
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, fn(v, k, i)]
    )
  )

const cacheKeyForType: Record<string, string> = {
  "User": "id",
  "Documentation": "id",
  "ComicSeries": "uuid",
  "ComicIssue": "uuid",
  "ComicStory": "uuid",
  "Creator": "uuid",
  "CreatorContent": "uuid",
  "HostingProvider": "uuid",
  "OAuthDetails": "uuid",
  "SearchResults": "searchId",
  "SearchQueryResponseInfo": "searchId",
  "SearchQueryResponseInfoDetails": "searchId",
  "HomeScreenComicSeries": "id",
  "ComicIssueForSeries": "seriesUuid"
}

const cacheTypesSet = new Set(Object.keys(cacheKeyForType));

let savedFieldsWhichNeedCacheKey: Record<string, string> | undefined;

/**
 * Creates a validator for the GraphQL query depth
 * @param {Number} maxDepth - The maximum allowed depth for any operation in a GraphQL document.
 * @param {Object} [options]
 * @param {String|RegExp|Function} options.ignore - Stops recursive depth checking based on a field name. Either a string or regexp to match the name, or a function that reaturns a boolean.
 * @param {Function} [callback] - Called each time validation runs. Receives an Object which is a map of the depths for each operation. 
 * @returns {Function} The validator function for GraphQL validation phase.
 */
export const requiredFields = (options: any = {}, callback = () => {}) => (validationContext: any) => {
  try {
    const { definitions } = validationContext.getDocument();
    const schema = validationContext.getSchema();
    
    const fieldsWhichNeedCacheKey = savedFieldsWhichNeedCacheKey || getFieldsWithCacheTypes(schema);
    if (!savedFieldsWhichNeedCacheKey) {
      savedFieldsWhichNeedCacheKey = fieldsWhichNeedCacheKey
    }

    const fragments = getFragments(definitions);
    const queries = getQueriesAndMutations(definitions);

    const queryDepths: Record<string, any> = {};
    for (const name in queries) {
      queryDepths[name] = getSubQueries(queries[name], fragments, validationContext, name, { fieldsWhichNeedCacheKey });
    }
    return validationContext;
  } catch (err: any) {
    console.error(err)
    validationContext.reportError(
      new ValidationError(err.message),
    );
    return validationContext
  }
}

function getFieldsWithCacheTypes(schema: any) {
  let fields: Record<string, string> = {};

  const allFieldObjects = objectMap(schema._typeMap, (v: any, key: string) => {
    if (/^__/.test(key)) { return }
    return v._fields
  });

  objectMap(allFieldObjects, (type: any, key: string) => {
    if (!type) { return }
    const cacheFields = getCacheFieldsForType({ type, key })
    fields = { ...fields, ...cacheFields }
    return
  });
  
  return fields
}

function getCacheFieldsForType({ type, key }: { type: any, key: string }) {
  let internalFields: Record<string, string> = {};  

  objectMap(type, (property: any) => {    
    const returnType = get(property.type, 'ofType.name', property.type.name);

    if (cacheTypesSet.has(returnType)) {
      internalFields[property.name] = returnType;
    }

    return
  });

  return internalFields
}

function getFragments(definitions: any[]) {
  return definitions.reduce((map: Record<string, any>, definition: any) => {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      map[definition.name.value] = definition
    }
    return map
  }, {})
}

// this will actually get both queries and mutations. we can basically treat those the same
function getQueriesAndMutations(definitions: any[]) {
  return definitions.reduce((map: Record<string, any>, definition: any) => {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      map[definition.name ? definition.name.value : ''] = definition
    }
    return map
  }, {})
}

function getSubQueries(node: any, fragments: Record<string, any>, context: any, operationName: string, options: any) {
  switch (node.kind) {
    case Kind.FIELD:
      return checkForPrimaryCacheKey(node, fragments, context, operationName, options)
    case Kind.FRAGMENT_SPREAD:
      const fragment = fragments[node.name.value]
      return checkForFragmentPrimaryCacheKey(fragment, fragments, context, operationName, options)
    case Kind.FRAGMENT_DEFINITION:
    case Kind.INLINE_FRAGMENT:
    case Kind.OPERATION_DEFINITION:
      return node.selectionSet.selections.map((selection: any) => {
        return getSubQueries(selection, fragments, context, operationName, options)
      })
    default:
      throw new Error('uh oh! depth crawler cannot handle:' + node.kind)
  }
}

function checkForPrimaryCacheKey(node: any, fragments: Record<string, any>, context: any, operationName: string, options: any) {
  if ((node.name  && /^__/.test(node.name.value)) || !node.selectionSet) {
    return
  }

  const { fieldsWhichNeedCacheKey } = options
  const cacheType = fieldsWhichNeedCacheKey[node.name.value];
  const selections = node.selectionSet.selections

  if (!cacheType) { return checkForSubQueries(selections, fragments, context, operationName, options) }

  const cacheKey = cacheKeyForType[cacheType]
  if (!cacheKey) { return checkForSubQueries(selections, fragments, context, operationName, options) }

  let propertiesInFragmentSet = new Set()
  let kindsInFragmentSet = new Set()

  selections.map((selection: any) => {
    kindsInFragmentSet.add(selection.kind)
  })

  if (!kindsInFragmentSet.has(Kind.FRAGMENT_SPREAD)){
    selections.map((selection: any) => {
      if (selection.kind === Kind.FIELD && selection.name) {
        propertiesInFragmentSet.add(selection.name.value)
      }
    })

    if (propertiesInFragmentSet.size > 0 && !propertiesInFragmentSet.has(cacheKey)) {
      throw new Error(`The type ${cacheType} is required to return the property ${cacheKey}. Inside of ${node.name.value} please add the property ${cacheKey} to the query.`)
    }
  }

  return checkForSubQueries(selections, fragments, context, operationName, options)
}

function checkForFragmentPrimaryCacheKey(node: any, fragments: Record<string, any>, context: any, operationName: string, options: any) {
  if (node.kind === Kind.FRAGMENT_DEFINITION && !node.selectionSet) {
    return
  }
  
  const selections = node.selectionSet.selections

  const cacheType = get(node, 'typeCondition.name.value', null)
  if (!cacheType) { return checkForSubQueries(selections, fragments, context, operationName, options) }

  const cacheKey = cacheKeyForType[cacheType]
  if (!cacheKey) { return checkForSubQueries(selections, fragments, context, operationName, options) }

  let propertiesInFragmentSet = new Set()
  let kindsInFragmentSet = new Set()

  selections.map((selection: any) => {
    kindsInFragmentSet.add(selection.kind)
  })

  if (!kindsInFragmentSet.has(Kind.FRAGMENT_SPREAD)){
    selections.map((selection: any) => {
      if (selection.kind === Kind.FIELD && selection.name) {
        propertiesInFragmentSet.add(selection.name.value)
      }
    })

    if (propertiesInFragmentSet.size > 0 && !propertiesInFragmentSet.has(cacheKey)) {
      throw new Error(`The type ${cacheType} is required to return the property ${cacheKey}. Inside of ${node.name.value} please add the property ${cacheKey} to the query.`)
    }
  }
  
  return checkForSubQueries(selections, fragments, context, operationName, options)
}

function checkForSubQueries(selections: any[], fragments: Record<string, any>, context: any, operationName: string, options: any) {
  const subSelections = selections.filter(selection => selection.selectionSet || selection.kind === Kind.FRAGMENT_SPREAD)

  return subSelections.map(selection => {
    getSubQueries(selection, fragments, context, operationName, options)
  })
}