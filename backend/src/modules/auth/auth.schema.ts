import { z } from 'zod';

export const registerBodySchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Логин не короче 3 символов')
    .max(32, 'Логин не длиннее 32 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Логин: только латиница, цифры и _'),
  email: z.string().trim().email('Некорректный email'),
  password: z.string().min(8, 'Пароль не короче 8 символов'),
});

export const loginBodySchema = z.object({
  login: z.string().trim().min(1, 'Введите логин или email'),
  password: z.string().min(1, 'Введите пароль'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
