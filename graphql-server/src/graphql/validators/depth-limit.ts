import { Kind } from 'graphql';
import { QueryTooComplexError } from '../error.js';
/**
 * Creates a validator for the GraphQL query depth
 * @param {Number} maxDepth - The maximum allowed depth for any operation in a GraphQL document.
 * @param {Object} [options]
 * @param {String|RegExp|Function} options.ignore - Stops recursive depth checking based on a field name. Either a string or regexp to match the name, or a function that reaturns a boolean.
 * @param {Function} [callback] - Called each time validation runs. Receives an Object which is a map of the depths for each operation. 
 * @returns {Function} The validator function for GraphQL validation phase.
 */
export const depthLimit = (maxDepth: number, options: any = {}, callback = () => {}) => (validationContext: any) => {
  try {
    const { definitions } = validationContext.getDocument()
    const fragments = getFragments(definitions)
    const queries = getQueriesAndMutations(definitions)
    const queryDepths: Record<string, number> = {}
    for (let name in queries) {
      queryDepths[name] = determineDepth(queries[name], fragments, 0, maxDepth, validationContext, name, options)
    }
    // callback(queryDepths)
    return validationContext
  } catch (err: any) {
    console.error(err)
    validationContext.reportError(
      new QueryTooComplexError(err.message),
    );
    return validationContext
  }
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

function determineDepth(node: any, fragments: Record<string, any>, depthSoFar: number, maxDepth: number, context: any, operationName: string, options: any) {
  if (depthSoFar > maxDepth) {
    throw new Error(`${operationName || 'Query'} exceeds maximum allowed operation depth of ${maxDepth}.`)
  }

  switch (node.kind) {
    case Kind.FIELD:
      // by default, ignore the introspection fields which begin with double underscores
      const shouldIgnore = /^__/.test(node.name.value)

      if (shouldIgnore || !node.selectionSet) {
        return 0
      }
      return 1 + Math.max(...node.selectionSet.selections.map((selection: any) =>
        determineDepth(selection, fragments, depthSoFar + 1, maxDepth, context, operationName, options)
      ))
    case Kind.FRAGMENT_SPREAD:
      return determineDepth(fragments[node.name.value], fragments, depthSoFar, maxDepth, context, operationName, options)
    case Kind.INLINE_FRAGMENT:
    case Kind.FRAGMENT_DEFINITION:
    case Kind.OPERATION_DEFINITION:
      return Math.max(...node.selectionSet.selections.map((selection: any) =>
        determineDepth(selection, fragments, depthSoFar, maxDepth, context, operationName, options)
      ))
    default:
      throw new Error('uh oh! depth crawler cannot handle: ' + node.kind)
  }
}