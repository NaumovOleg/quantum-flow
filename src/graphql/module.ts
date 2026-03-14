import {
  GRAPHQL_ARG,
  GRAPHQL_FIELD,
  GRAPHQL_INPUT_TYPE,
  GRAPHQL_MUTATION,
  GRAPHQL_QUERY,
  GRAPHQL_SUBSCRIPTION,
  GRAPHQL_TYPE,
} from '@constants';
import { isClass } from '@utils';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

export class GraphQLModule {
  private schema: GraphQLSchema;
  private typeCache: Map<any, GraphQLObjectType> = new Map();
  private inputTypeCache: Map<any, GraphQLInputObjectType> = new Map();

  private typeMap: Record<string, any> = {
    String: GraphQLString,
    Number: GraphQLFloat,
    Boolean: GraphQLBoolean,
    Date: GraphQLString,
    string: GraphQLString,
    number: GraphQLFloat,
    boolean: GraphQLBoolean,
    int: GraphQLInt,
    float: GraphQLFloat,
    id: GraphQLID,
    GraphQLString: GraphQLString,
    GraphQLInt: GraphQLInt,
    GraphQLFloat: GraphQLFloat,
    GraphQLBoolean: GraphQLBoolean,
    GraphQLID: GraphQLID,
  };

  constructor(private controllers: any[]) {
    this.schema = this.buildSchema();
  }

  private buildSchema(): GraphQLSchema {
    const queryFields: Record<string, any> = {};
    const mutationFields: Record<string, any> = {};
    const subscriptionFields: Record<string, any> = {};

    let hasQueries = false;
    let hasMutations = false;

    for (const controller of this.controllers) {
      const prototype = Object.getPrototypeOf(controller.constructor.prototype);
      const methods = Object.getOwnPropertyNames(prototype).filter((m) => m !== 'constructor');

      for (const methodName of methods) {
        const queryMeta = Reflect.getMetadata(GRAPHQL_QUERY, prototype, methodName);

        if (queryMeta) {
          queryFields[methodName] = this.createFieldConfig(
            controller,
            prototype,
            methodName,
            queryMeta,
          );
          hasQueries = true;
        }

        const mutationMeta = Reflect.getMetadata(GRAPHQL_MUTATION, prototype, methodName);
        if (mutationMeta) {
          mutationFields[methodName] = this.createFieldConfig(
            controller,
            prototype,
            methodName,
            mutationMeta,
          );
          hasMutations = true;
        }

        const subMeta = Reflect.getMetadata(GRAPHQL_SUBSCRIPTION, prototype, methodName);
        if (subMeta) {
          subscriptionFields[methodName] = this.createFieldConfig(
            controller,
            prototype,
            methodName,
            subMeta,
          );
        }
      }
    }

    if (!hasQueries) {
      queryFields['_test'] = {
        type: GraphQLString,
        resolve: () => 'GraphQL is working!',
      };
    }

    return new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: queryFields,
      }),
      mutation: hasMutations
        ? new GraphQLObjectType({ name: 'Mutation', fields: mutationFields })
        : undefined,
      subscription:
        Object.keys(subscriptionFields).length > 0
          ? new GraphQLObjectType({ name: 'Subscription', fields: subscriptionFields })
          : undefined,
    });
  }

  private convertToGraphQLType(type: any, isInput: boolean = false): any {
    if (!type) return GraphQLString;

    if (Array.isArray(type)) {
      const innerType = this.convertToGraphQLType(type[0], isInput);
      return new GraphQLList(innerType);
    }

    if (typeof type === 'function') {
      if (type === String) return GraphQLString;
      if (type === Number) return GraphQLFloat;
      if (type === Boolean) return GraphQLBoolean;
      if (type === Date) return GraphQLString;

      const hasInputType = Reflect.hasMetadata(GRAPHQL_INPUT_TYPE, type);
      const hasObjectType = Reflect.hasMetadata(GRAPHQL_TYPE, type);

      if (isInput || hasInputType) {
        if (hasInputType) {
          return this.getOrCreateInputObjectType(type);
        }
        return GraphQLString;
      }

      if (hasObjectType) {
        return this.getOrCreateObjectType(type);
      }
    }

    if (typeof type === 'string' && this.typeMap[type]) {
      return this.typeMap[type];
    }

    return GraphQLString;
  }

  private createFieldConfig(controller: any, prototype: any, methodName: string, meta: any) {
    const argMetas = Reflect.getMetadata(GRAPHQL_ARG, prototype, methodName) || [];
    argMetas.sort((a: any, b: any) => a.index - b.index);

    const args: Record<string, any> = {};
    for (const arg of argMetas) {
      const argType = this.convertToGraphQLType(arg.type, true);
      args[arg.name] = {
        type: arg.required ? new GraphQLNonNull(argType) : argType,
        description: arg.description,
        defaultValue: arg.defaultValue,
      };
    }

    const returnType = this.convertToGraphQLType(meta.type);

    return {
      type: returnType,
      args: args,
      resolve: async (source: any, args: any, context: any, info: any) => {
        try {
          const methodArgs = argMetas.map((arg: any) => args[arg.name]);
          return await controller[methodName](...methodArgs, context);
        } catch (error) {
          console.error(`❌ Error in GraphQL resolver ${methodName}:`, error);
          throw error;
        }
      },
    };
  }

  private getOrCreateObjectType(cls: any): GraphQLObjectType {
    if (this.typeCache.has(cls)) {
      return this.typeCache.get(cls)!;
    }

    const typeMeta = Reflect.getMetadata(GRAPHQL_TYPE, cls) || { name: cls.name };
    const fieldsMeta = Reflect.getMetadata(GRAPHQL_FIELD, cls.prototype) || [];

    const fields: Record<string, any> = {};
    for (const field of fieldsMeta) {
      if (typeof field.type === 'function' && !isClass(field.type)) {
        field.type = field.type();
      }

      const convertedType = this.convertToGraphQLType(field.type);

      fields[field.propertyKey] = {
        type: convertedType,
        resolve: (obj: any) => {
          const value = obj[field.propertyKey];
          return value;
        },
      };
    }

    const objectType = new GraphQLObjectType({
      name: typeMeta.name,
      fields: fields,
    });

    this.typeCache.set(cls, objectType);
    return objectType;
  }

  private getOrCreateInputObjectType(cls: any): GraphQLInputObjectType {
    if (this.inputTypeCache.has(cls)) {
      return this.inputTypeCache.get(cls)!;
    }

    const typeMeta = Reflect.getMetadata(GRAPHQL_INPUT_TYPE, cls) || { name: `${cls.name}Input` };
    const fieldsMeta = Reflect.getMetadata(GRAPHQL_FIELD, cls.prototype) || [];

    const fields: Record<string, any> = {};
    for (const field of fieldsMeta) {
      fields[field.propertyKey] = {
        type: this.convertToGraphQLType(field.type, true),
      };
    }

    const inputType = new GraphQLInputObjectType({
      name: typeMeta.name,
      fields: fields,
    });

    this.inputTypeCache.set(cls, inputType);
    return inputType;
  }

  public getSchema(): GraphQLSchema {
    return this.schema;
  }
}
