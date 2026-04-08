const CreateTicketSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CreateTicketSchema",
  type: "object",
  properties: {
    group_id: { type: "string" },
    title: { type: "string", minLength: 3 },
    description: { type: "string" },
    status: { type: "string" },
    priority: { type: "string" },
    assigned_to: { type: ["string", "null"] },
    created_by: { type: "string" },
    deadline: { type: ["string", "null"] },
    comments: { type: "array" },
    history: { type: "array" }
  },
  required: ["group_id", "title", "created_by"],
  additionalProperties: false
};

const UpdateTicketSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "UpdateTicketSchema",
    type: "object",
    properties: {
        title: { type: "string", minLength: 3 },
        description: { type: "string" },
        status: { type: "string" },
        priority: { type: "string" },
        assigned_to: { type: ["string", "null"] },
        deadline: { type: ["string", "null"] },
        comments: { type: "array" },
        history: { type: "array" }
    },
    additionalProperties: false
};

module.exports = { CreateTicketSchema, UpdateTicketSchema };
