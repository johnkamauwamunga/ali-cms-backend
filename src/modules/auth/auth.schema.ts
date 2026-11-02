import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(254)
  .transform((email) => email.toLowerCase());

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{1,14}$/, "Enter a phone number in E.164 format");

const passwordSchema = z.string().min(12).max(128);

export const initialSetupSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: emailSchema,
    phone: phoneSchema.optional(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  identifier: z.union([emailSchema, phoneSchema]),
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const securityQuestionUpdateSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  securityQuestionId: z.string().cuid(),
  securityAnswer: z.string().trim().min(2).max(200),
});

export type InitialSetupInput = z.infer<typeof initialSetupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SecurityQuestionUpdateInput = z.infer<
  typeof securityQuestionUpdateSchema
>;
