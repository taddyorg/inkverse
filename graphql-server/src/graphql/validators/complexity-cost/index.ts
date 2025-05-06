import { GraphQLError, TypeInfo, visit, visitWithTypeInfo } from 'graphql';
import ComplexityVisitor from './ComplexityVisitor.js';
import { QueryTooComplexError } from '../../error.js';

export function complexityLimitExceededErrorMessage() {
  // By default, don't respond with the cost to avoid leaking information about
  // the cost scheme to a potentially malicious client.
  return 'query exceeds complexity limit';
}

export function createComplexityLimitRule(
  maxCost: number,
  options: any = {},
) {
  let { onCost, createError, formatErrorMessage } = options;
  formatErrorMessage = formatErrorMessage || complexityLimitExceededErrorMessage;

  return function ComplexityLimit(context: any) {
    const visitor = new ComplexityVisitor(context, options);
    // eslint-disable-next-line no-underscore-dangle
    const typeInfo = context._typeInfo || new TypeInfo(context.getSchema());

    return {
      Document: {
        enter(node: any) {
          visit(node, visitWithTypeInfo(typeInfo, visitor));
        },
        leave(node: any) {
          const cost = visitor.getCost();

          if (onCost) {
            onCost(cost, context);
          }

          if (cost > maxCost) {
            return context.reportError(
              new QueryTooComplexError(
                'This Query is too complex. Please delete some properties and try again.',
                { meta: cost, nodes: [node] },
              ),
            );
          }
        },
      },
    };
  };
}