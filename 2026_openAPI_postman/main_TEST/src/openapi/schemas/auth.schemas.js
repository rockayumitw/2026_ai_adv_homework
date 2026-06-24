const { z } = require('../zod');

const RegisterBodySchema = z.object({
  name:     z.string().min(1).openapi({ example: 'Alice' }),
  email:    z.string().email().openapi({ example: 'alice@example.com' }),
  password: z.string().min(6).openapi({ example: 'secret123' }),
}).openapi('RegisterBody');

const LoginBodySchema = z.object({
  email:    z.string().email().openapi({ example: 'alice@example.com' }),
  password: z.string().min(1).openapi({ example: 'secret123' }),
}).openapi('LoginBody');

const PublicUserSchema = z.object({
  id:        z.number().int().positive(),
  name:      z.string(),
  email:     z.string().email(),
  createdAt: z.string().datetime(),
}).openapi('PublicUser');

const AuthResponseSchema = z.object({
  user:  PublicUserSchema,
  token: z.string(),
}).openapi('AuthResponse');

const MeResponseSchema = z.object({
  user: PublicUserSchema,
}).openapi('MeResponse');

module.exports = {
  RegisterBodySchema,
  LoginBodySchema,
  PublicUserSchema,
  AuthResponseSchema,
  MeResponseSchema,
};
