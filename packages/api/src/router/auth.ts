import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from 'zod';

export const authRouter = createTRPCRouter({
  login: publicProcedure.input(z.object({
    email: z.string(),
    password: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const { prisma } = ctx;
    const { email, password } = input;

    const query = await prisma.account.findFirst({
      where: {
        email,
        password
      }
    })

    if (!query) throw new TRPCError({
      code: "NOT_FOUND",
      message: "Bad Credentials!"
    })

    return query;
  }),
  register: publicProcedure.input(z.object({
    email: z.string(),
    password: z.string(),
    name: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const { prisma } = ctx;
    const { email, password, name } = input;

    const query = await prisma.account.findUnique({
      where: {
        email
      }
    })

    if (query) throw new TRPCError({
      code: "FORBIDDEN",
      message: "Account with this email address already exists!"
    })

    const register = await prisma.account.create({
      data: {
        email,
        name,
        password
      }
    });

    return register;
  }),
});
