import { GraphQLList, GraphQLNonNull, GraphQLObjectType, print, isIntrospectionType } from 'graphql';

// -- code vendored from: https://github.com/graphql/graphql-js/blob/15.x.x/src/validation/rules/OverlappingFieldsCanBeMerged.js#L636-L657
function isSameArguments(arguments1: any[], arguments2: any[]) {
  if (!arguments1 || !arguments2) return false;
  if (arguments1.length !== arguments2.length) {
    return false;
  }
  return arguments1.every((argument1) => {
    const argument2 = arguments2.find(
      ({ name }) => name.value === argument1.name.value,
    );

    if (!argument2) {
      return false;
    }

    return print(argument1.value) === print(argument2.value);
  });
}
// ---

function isSameInlineFragment(selection1: any, selection2: any) {
  return (
    selection1.kind === 'InlineFragment' &&
    selection1.typeCondition.name.value === selection2.typeCondition.name.value
  );
}

function isSameSelection(selection1: any, selection2: any) {
  return (
    selection1.kind === selection2.kind &&
    selection1.name?.value === selection2.name?.value &&
    (isSameInlineFragment(selection1, selection2) ||
      isSameArguments(selection1.arguments, selection2.arguments))
  );
}

function uniqSelections(selections: any[]) {
  const results: any[] = [];
  for (const selection of selections) {
    const other = results.find((s) => isSameSelection(selection, s));
    if (!other) {
      // clone nodes with selections to avoid mutating the original AST below

      results.push(selection.selectionSet ? { ...selection } : selection);
      continue;
    }

    const { selectionSet } = other;
    if (selectionSet) {
      // merge nested selections they will be deduped later on
      other.selectionSet = {
        ...selectionSet,
        selections: [
          ...selectionSet.selections,
          ...selection.selectionSet.selections,
        ],
      };
    }
  }
  return results;
}

class ComplexityVisitor {
  context: any;
  scalarCost: number;
  objectCost: number;
  listFactor: number;
  introspectionListFactor: number;
  costFactor: number;
  cost: number;
  Field: any;
  FragmentDefinition: any;
  SelectionSet: any;

  constructor(
    context: any,
    {
      scalarCost = 1,
      objectCost = 0,
      listFactor = 10,

      // Special list factor to make schema queries not have huge costs.
      introspectionListFactor = 2,
    },
  ) {
    this.context = context;

    this.scalarCost = scalarCost;
    this.objectCost = objectCost;
    this.listFactor = listFactor;
    this.introspectionListFactor = introspectionListFactor;

    this.costFactor = 1;
    this.cost = 0;

    this.Field = {
      enter: this.enterField,
      leave: this.leaveField,
    };
    this.FragmentDefinition = () => {
      // don't visit any further we will include these at the spread location
      return false;
    };

    this.SelectionSet = this.flattenFragmentSpreads;
  }

  flattenFragmentSpreads(selectionSet: any) {
    const nextSelections = selectionSet.selections.flatMap((node: any) => {
      if (node.kind === 'FragmentSpread') {
        const fragment = this.context.getFragment(node.name.value);

        if (!fragment) return [];
        return this.flattenFragmentSpreads(fragment.selectionSet).selections;
      }

      return node;
    });

    return {
      ...selectionSet,
      selections: uniqSelections(nextSelections),
    };
  }

  enterField() {
    this.costFactor *= this.getFieldCostFactor();

    this.cost += this.costFactor * this.getFieldCost();
  }

  leaveField() {
    this.costFactor /= this.getFieldCostFactor();
  }

  getFieldCostFactor() {
    const fieldDef = this.context.getFieldDef();
    if (fieldDef?.extensions?.getCostFactor) {
      return fieldDef.extensions.getCostFactor();
    }

    const directiveCostFactor = this.getDirectiveValue('costFactor');
    if (directiveCostFactor != null) {
      return directiveCostFactor;
    }

    return this.getTypeCostFactor(this.context.getType());
  }

  getTypeCostFactor(type: any): number {
    if (type instanceof GraphQLNonNull) {
      return this.getTypeCostFactor(type.ofType);
    }

    if (type instanceof GraphQLList) {
      const typeListFactor = this.isIntrospectionList(type)
        ? this.introspectionListFactor
        : this.listFactor;
      return typeListFactor * this.getTypeCostFactor(type.ofType);
    }

    return 1;
  }

  isIntrospectionList({ ofType }: { ofType: any }) {
    let type = ofType;
    if (type instanceof GraphQLNonNull) {
      type = type.ofType;
    }

    return isIntrospectionType(type);
  }

  getFieldCost() {
    const fieldDef = this.context.getFieldDef();
    if (fieldDef?.extensions?.getCost) {
      return fieldDef.extensions.getCost();
    }

    const directiveCost = this.getDirectiveValue('cost');
    if (directiveCost != null) {
      return directiveCost;
    }

    return this.getTypeCost(this.context.getType());
  }

  getTypeCost(type: any): number {
    if (type instanceof GraphQLNonNull || type instanceof GraphQLList) {
      return this.getTypeCost(type.ofType);
    }

    return type instanceof GraphQLObjectType
      ? this.objectCost
      : this.scalarCost;
  }

  getDirectiveValue(directiveName: string) {
    const fieldDef = this.context.getFieldDef();
    if (!fieldDef?.astNode?.directives) {
      return null;
    }

    const directive = fieldDef.astNode.directives.find(
      ({ name }: { name: any }) => name.value === directiveName,
    );
    if (!directive) {
      return null;
    }

    const valueArgument = directive.arguments.find(
      (argument: any) => argument.name.value === 'value',
    );

    if (!valueArgument) {
      const fieldName = fieldDef.name;
      const parentTypeName = this.context.getParentType().name;

      throw new Error(
        `No \`value\` argument defined in \`@${directiveName}\` directive ` +
          `on \`${fieldName}\` field on \`${parentTypeName}\`.`,
      );
    }

    return parseFloat(valueArgument.value.value);
  }

  getCost() {
    return this.cost;
  }
}

export default ComplexityVisitor;
