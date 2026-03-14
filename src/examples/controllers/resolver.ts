import { Arg, Field, InputType, Mutation, ObjectType, Query, Resolver } from 'quantum-flow/graphql';

@ObjectType('User')
export class User {
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
export class CreateUserInput {
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
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string;
  @Field({ nullable: true })
  email?: string;
  @Field({ nullable: true })
  bio?: string;
  @Field(() => [String])
  roles?: string[];
}

@Resolver()
export class UserResolver {
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

  @Query(() => User)
  async getUser(@Arg('id', String, { required: true }) id: string) {
    return this.users.find((u) => u.id === id);
  }

  @Query(() => [User])
  async getUsers() {
    return this.users;
  }

  @Mutation(() => User)
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

  @Mutation(() => User)
  async updateUser(
    @Arg('id', String, { required: true }) id: string,
    @Arg('input', UpdateUserInput, { required: true }) input: UpdateUserInput,
  ) {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) throw new Error(`User with id ${id} not found`);
    this.users[userIndex] = { ...this.users[userIndex], ...input };
    return this.users[userIndex];
  }

  @Mutation(() => Boolean)
  async deleteUser(@Arg('id', String, { required: true }) id: string) {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) throw new Error(`User with id ${id} not found`);
    this.users.splice(userIndex, 1);
    return true;
  }

  @Query(() => [User])
  async searchUsers(@Arg('name', String, { required: true }) name: string) {
    return this.users.filter((u) => u.name.toLowerCase().includes(name.toLowerCase()));
  }
}
