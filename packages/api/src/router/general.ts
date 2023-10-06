


/* eslint-disable @typescript-eslint/no-unused-vars */
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from 'zod';
import moment from "moment";
import type { AxiosResponse } from 'axios';
import axios from 'axios'

export const generalRouter = createTRPCRouter({
  initiateInternationalPayment: publicProcedure.input(z.object({
    payerWallet: z.string(),
    receiverWallet: z.string(),
    amount: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const { payerWallet, receiverWallet, amount } = input;
    const { prisma } = ctx;

    // check if the two have the wallets of the specified respective currencies
    const PayerWallet = await prisma.currencyWallet.findUniqueOrThrow({
      where: {
        id: payerWallet
      }
    });

    const ReceiverWallet = await prisma.currencyWallet.findUniqueOrThrow({
      where: {
        id: receiverWallet
      }
    });

    // check
    const validateWallet1 = PayerWallet.balance > amount
    const validateWallet2 = ReceiverWallet ? true : false

    if (!validateWallet1 || !validateWallet2) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "Invalid Wallet Data Encountered"
      })
    };

    // do it, do the conversion, and add the amount
    const convert = async (amount: number, currencyFrom: string, currencyTo: string) => {
      const params = `/pair/${currencyFrom}/${currencyTo}/${amount}`

      const url = " https://v6.exchangerate-api.com/v6/7e718146d25abc8e31f12e10" + params;

      const response: AxiosResponse<{
        conversion_rate: number,
        conversion_result: number
      }> = await axios.get(url);

      return {
        conversion: response.data.conversion_result,
        rate: response.data.conversion_rate
      }
    }

    const { conversion, rate } = await convert(amount, PayerWallet.currency, ReceiverWallet.currency);

    const createInternationalPayment = await prisma.internationalPayment.create({
      data: {
        amountInCurrency1: amount,
        exchangeRate1to2: rate,
        sourceId: payerWallet,
        receiverId: receiverWallet,
      }
    })

    return {
      id: createInternationalPayment.id,
      amountInCurrency2: conversion
    };
  }),
  pay: publicProcedure.input(z.object({
    payerId: z.string(),
    receiverEmail: z.string(),
    amount: z.number(),
    currency: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { payerId, receiverEmail, amount, currency } = input;
    const { prisma } = ctx;

    // First, search for the Currency Wallet of the Payer
    const payerWallet = await prisma.currencyWallet.findFirst({
      where: {
        accountId: payerId,
        currency
      }
    })

    const receiverAccount = await prisma.account.findUniqueOrThrow({
      where: {
        email: receiverEmail
      },
      include: {
        currencyWallets: true
      }
    })

    if (!payerWallet) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `No '${currency}' Wallet found in the Account of the Payer...`
      })

      return;
    }

    // Check if it has enough balance
    if (payerWallet.balance < amount) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: 'Insufficient Balance'
      })
    }

    // Search for the Currency Wallet of the Receiver 
    const receiverHasCurrencyWallet = receiverAccount.currencyWallets.map((w) => w.currency).find((c) => c == currency) ? true : false
    const receiverHasADefaultWallet = receiverAccount.defaultWallet ? receiverAccount.currencyWallets.find((cW) => cW.id == receiverAccount.defaultWallet) : undefined

    if (!receiverHasCurrencyWallet) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: receiverHasADefaultWallet ? `CAN_DO_INTL ${receiverHasADefaultWallet.id} ${receiverHasADefaultWallet.currency}` : `No '${currency}' Wallet found in the Account of the Reciever...`
      })
    }
    // message[0] is CAN_DO_INTL
    // message[1] is WALLET ID
    // message[2] is CURRENCY

    const receiverWallet = receiverAccount.currencyWallets.find((cW) => cW.currency == currency)!

    // Transfer Process
    const deductAmount = prisma.currencyWallet.update({
      where: {
        id: payerWallet.id
      },
      data: {
        balance: {
          decrement: amount
        }
      }
    })

    const addMoneyToReceiversWallet = prisma.currencyWallet.update({
      where: {
        id: receiverWallet.id
      },
      data: {
        balance: {
          increment: amount
        }
      }
    })

    const createTransaction = prisma.transaction.create({
      data: {
        amount,
        currencyWalletId: payerWallet.id,
        target: `${receiverWallet.id}`
      }
    })

    const procedures = await prisma.$transaction([deductAmount, addMoneyToReceiversWallet, createTransaction]);

    return;
  }),
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

    return {
      currencyWallet: query,
      allWallets: account.currencyWallets
    };
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
