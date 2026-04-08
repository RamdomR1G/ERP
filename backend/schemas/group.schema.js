const CreateGroupSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CreateGroupSchema",
  type: "object",
  properties: {
    name: { type: "string", minLength: 2 },
    icon: { type: "string" },
    description: { type: "string" },
    color: { type: "string" }
  },
  required: ["name"],
  additionalProperties: false
};

const UpdateGroupSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "UpdateGroupSchema",
    type: "object",
    properties: {
      name: { type: "string", minLength: 2 },
      icon: { type: "string" },
      description: { type: "string" },
      color: { type: "string" }
    },
    additionalProperties: false
  };

module.exports = { CreateGroupSchema, UpdateGroupSchema };
