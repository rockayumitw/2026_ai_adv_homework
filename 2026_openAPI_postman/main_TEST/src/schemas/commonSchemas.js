const { z } = require('zod');

const ErrorSchema = z.object({
  message: z.string(),
}).openapi('Error');

const MessageSchema = z.object({
  message: z.string(),
}).openapi('Message');

module.exports = { ErrorSchema, MessageSchema };
