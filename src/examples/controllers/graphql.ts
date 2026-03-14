import { Controller } from 'quantum-flow/core';
import { Arg, Field, InputType, Mutation, ObjectType, Query } from 'quantum-flow/graphql';

@ObjectType('User')
class User {
  @Field()
  id: string;
  @Field()
  name: string;
  @Field()
  email: string;
  @Field({ nullable: true })
  bio?: string;
  @Field(() => [String])
  roles: string[];
}

@InputType('CreateUserInput')
class CreateUserInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => [String])
  roles?: string[];
}

@InputType('UpdateUserInput')
class UpdateUserInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => [String])
  roles?: string[];
}

@Controller('/graphql')
export class GraphQlController {
  private users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Software Developer',
      roles: ['user', 'admin'],
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      bio: 'Product Manager',
      roles: ['user'],
    },
  ];

  // 🔍 Query: получить пользователя по ID
  @Query(User)
  async getUser(@Arg('id', String, { required: true }) id: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

  // 🔍 Query: получить всех пользователей
  @Query(() => [User])
  async getUsers() {
    return this.users;
  }

  // ✏️ Mutation: создать пользователя
  @Mutation(User)
  async createUser(@Arg('input', CreateUserInput, { required: true }) input: CreateUserInput) {
    const newUser: User = {
      id: String(this.users.length + 1),
      name: input.name,
      email: input.email,
      bio: input.bio,
      roles: input.roles || ['user'],
    };
    this.users.push(newUser);
    return newUser;
  }

  // ✏️ Mutation: обновить пользователя
  @Mutation(User)
  async updateUser(
    @Arg('id', String, { required: true }) id: string,
    @Arg('input', UpdateUserInput, { required: true }) input: UpdateUserInput,
  ) {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...input,
    };

    return this.users[userIndex];
  }

  // ✏️ Mutation: удалить пользователя
  @Mutation(() => Boolean)
  async deleteUser(@Arg('id', String, { required: true }) id: string) {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    this.users.splice(userIndex, 1);
    return true;
  }

  // 🔍 Query: поиск пользователей по имени
  @Query(() => [User])
  async searchUsers(@Arg('name', String, { required: true }) name: string) {
    return this.users.filter((u) => u.name.toLowerCase().includes(name.toLowerCase()));
  }
}
