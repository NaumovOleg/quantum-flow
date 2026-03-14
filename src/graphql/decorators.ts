import {
  GRAPHQL_ARG,
  GRAPHQL_FIELD,
  GRAPHQL_INPUT_TYPE,
  GRAPHQL_MUTATION,
  GRAPHQL_QUERY,
  GRAPHQL_SUBSCRIPTION,
  GRAPHQL_TYPE,
} from '@constants';
import 'reflect-metadata';

import {
  ArgMetadata,
  ArgOptions,
  FieldMetadata,
  GraphQLType,
  QueryMetadata,
  TypeMetadata,
} from '@types';

export interface MutationMetadata extends QueryMetadata {}
export interface SubscriptionMetadata extends QueryMetadata {}

/**
 * Class decorator to mark a class as a GraphQL ObjectType.
 * @param {string} [name] - Optional name of the GraphQL ObjectType. Defaults to the class name.
 */
export function ObjectType(name?: string): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(GRAPHQL_TYPE, { name: name || target.name } as TypeMetadata, target);
  };
}

/**
 * Class decorator to mark a class as a GraphQL InputType.
 * @param {string} [name] - Optional name of the GraphQL InputType. Defaults to the class name.
 */
export function InputType(name?: string): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(
      GRAPHQL_INPUT_TYPE,
      { name: name || target.name } as TypeMetadata,
      target,
    );
  };
}

/**
 * Property decorator to mark a class property as a GraphQL Field.
 * @param {GraphQLType | (() => GraphQLType) | { nullable: true }} [type] - The GraphQL type or a function returning the type. Can specify nullable.
 */
export function Field(
  type?: GraphQLType | (() => GraphQLType) | { nullable: true },
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const fields: FieldMetadata[] = Reflect.getMetadata(GRAPHQL_FIELD, target) || [];
    fields.push({ propertyKey: propertyKey as string, type });
    Reflect.defineMetadata(GRAPHQL_FIELD, fields, target);
  };
}

/**
 * Parameter decorator to define a GraphQL argument.
 * @param {string} [name] - Name of the argument.
 * @param {GraphQLType} [type] - GraphQL type of the argument.
 * @param {ArgOptions} [options] - Additional options like required, description, defaultValue.
 */
export function Arg(name?: string, type?: GraphQLType, options?: ArgOptions): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    if (propertyKey === undefined) {
      throw new Error('@Arg decorator must be used on a method parameter');
    }

    const args: ArgMetadata[] = Reflect.getMetadata(GRAPHQL_ARG, target, propertyKey) || [];
    args.push({
      index: parameterIndex,
      name: name || `arg${parameterIndex}`,
      type: type || String,
      required: options?.required || false,
      description: options?.description,
      defaultValue: options?.defaultValue,
    });
    Reflect.defineMetadata(GRAPHQL_ARG, args, target, propertyKey);
  };
}

/**
 * Method decorator to mark a method as a GraphQL Query.
 * @param {GraphQLType | (() => GraphQLType)} [returnType] - Return type of the query.
 */
export function Query(returnType?: GraphQLType | (() => GraphQLType)): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      GRAPHQL_QUERY,
      { type: returnType, method: propertyKey as string } as QueryMetadata,
      target,
      propertyKey,
    );
  };
}

/**
 * Method decorator to mark a method as a GraphQL Mutation.
 * @param {GraphQLType | (() => GraphQLType)} [returnType] - Return type of the mutation.
 */
export function Mutation(returnType?: GraphQLType | (() => GraphQLType)): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      GRAPHQL_MUTATION,
      { type: returnType, method: propertyKey as string } as MutationMetadata,
      target,
      propertyKey,
    );
  };
}

/**
 * Method decorator to mark a method as a GraphQL Subscription.
 * @param {GraphQLType | (() => GraphQLType)} [returnType] - Return type of the subscription.
 */
export function Subscription(returnType?: GraphQLType | (() => GraphQLType)): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      GRAPHQL_SUBSCRIPTION,
      { type: returnType, method: propertyKey as string } as SubscriptionMetadata,
      target,
      propertyKey,
    );
  };
}
