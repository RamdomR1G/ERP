const CreateUserSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CreateUserSchema",
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 3,
      maxLength: 100
    },
    email: {
      type: "string",
      format: "email"
    },
    password: {
      type: "string",
      minLength: 8
    },
    role: {
      type: "string",
      enum: ["Admin", "User", "Manager", "Guest"]
    },
    group_id: {
      type: "string"
    },
    status: {
      type: "string",
      enum: ["Active", "Inactive"]
    },
    permissions: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    }
  },
  required: ["name", "email", "password", "role", "group_id"]
};

const UpdateUserSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "UpdateUserSchema",
  type: "object",
  properties: {
    name: { type: "string", minLength: 3 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 8 },
    role: { type: "string", enum: ["Admin", "User", "Manager", "Guest"] },
    group_id: { type: "string" },
    status: { type: "string", enum: ["Active", "Inactive"] },
    permissions: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true
    }
  },
  additionalProperties: false
};

const LoginUserSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "LoginUserSchema",
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string" }
  },
  required: ["email", "password"],
  additionalProperties: false
};

module.exports = {
    CreateUserSchema,
    UpdateUserSchema,
    LoginUserSchema
};
