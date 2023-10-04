import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from 'zod';

export const generalRouter = createTRPCRouter({
  getWalletInformation: publicProcedure.input(z.object({
    accountId: z.string(),
    walletId: z.string()
  })).query(async ({ ctx, input }) => {
    const { prisma } = ctx;
    const { accountId, walletId } = input;

    if (accountId == 'unauthed') {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not Authenticated!'
      })

      return;
    }

    const account = await prisma.account.findUniqueOrThrow({
      where: {
        id: accountId
      },
      include: {
        currencyWallets: true
      }
    })

    const found = account.currencyWallets.find((c) => c.id == walletId)

    if (!found) throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'This Wallet is not linked to your account!'
    });

    const query = await prisma.currencyWallet.findUniqueOrThrow({
      where: {
        id: walletId
      },
      include: {
        account: true,
        deposits: true,
        transactions: true
      }
    })

    return query;
  }),
  setupWallet: publicProcedure.input(z.object({
    currency: z.string(),
    pin: z.number(),
    money: z.number(),
    userId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { prisma } = ctx;
    const { money, currency, pin, userId } = input;

    // search for if they have a wallet with same currency
    const search = await prisma.currencyWallet.findFirst({
      where: {
        accountId: userId,
        currency
      }
    })

    if (search) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `User Account already has a '${currency}' Wallet`
      })

      return;
    }

    const query = await prisma.currencyWallet.create({
      data: {
        pin,
        currency,
        balance: money,
        account: {
          connect: {
            id: userId
          }
        }
      }
    })

    return query;
  }),
  getWallets: publicProcedure.input(z.object({
    account: z.string()
  })).query(async ({ ctx, input }) => {
    const { prisma } = ctx;
    const { account } = input;

    if (account == 'unauthed') throw new TRPCError({
      code: 'FORBIDDEN',
      message: "Unauthed User"
    })

    const query = await prisma.account.findUniqueOrThrow({
      where: {
        id: account
      },
      include: {
        currencyWallets: true
      }
    })

    return query;
  }),
});
