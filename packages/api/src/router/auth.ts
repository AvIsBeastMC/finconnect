import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from 'zod';
import moment from "moment";

const DeviceTypeSchema = z.enum(["ios", "android", "windows", "macos", "web"])
export const authRouter = createTRPCRouter({
  logOut: publicProcedure.input(z.object({
    accountId: z.string(),
    deviceId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { accountId, deviceId } = input;
    const { prisma } = ctx;

    const query = await prisma.account.update({
      where: {
        id: accountId
      },
      data: {
        devices: {
          disconnect: {
            id: deviceId
          }
        }
      }
    });

    return query;
  }),
  login: publicProcedure.input(z.object({
    email: z.string().email(),
    password: z.string(),
    deviceId: z.string(),
    deviceType: DeviceTypeSchema,
    autoLogin: z.boolean()
  })).mutation(async ({ ctx, input }) => {
    const { prisma } = ctx;
    const { email, password, deviceType, deviceId, autoLogin } = input;

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

    // await prisma.log.create({
    //   data: {
    //     message: `[${autoLogin ? 'AUTOLOGIN' : 'LOGIN'}] ${deviceType} ${deviceId} ${moment().format()}`,
    //     type: 'LOGIN',
    //     accountId: query.id,
    //   }
    // })

    // setup/check device
    const createOrUpdateDevice = await prisma.device.upsert({
      where: {
        id: deviceId
      },
      create: {
        id: deviceId,
        platform: deviceType,
        account: {
          connect: {
            id: query.id
          }
        },
      },
      update: {
        accountId: query.id,
        platform: deviceType
      }
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
