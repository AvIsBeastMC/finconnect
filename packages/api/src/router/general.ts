


/* eslint-disable @typescript-eslint/no-unused-vars */
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from 'zod';
import moment from "moment";
import type { AxiosResponse } from 'axios';
import axios from 'axios'
import Stripe from 'stripe'
const stripe = new Stripe('sk_test_51JaBz8SE4v5ScYygqpKyaKDctk0Q4JvgocYTWJsIb49kvsYWWVlF79aXYD540ztpHOLDuBkP5ZhCetGj9wLPQerM002BxIf2V1', {
  apiVersion: '2023-08-16'
});

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

export const generalRouter = createTRPCRouter({
  getPrivacyPolicy: publicProcedure
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      // const host = process.env.NODE_ENV == 'production' ? "https://payments.vimistudy.in" : "http://192.168.1.35:3000"

      const data = await fetch(`https://finconnect.arunnya.com/privacy-policy.md`)
      const md = await data.text();

      return md;
    }),
  getActivity: publicProcedure.input(z.object({
    accountId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { accountId } = input;
    const { prisma } = ctx;

    const query = await prisma.transaction.findMany({
      where: {
        currencyWallet: {
          accountId
        }
      },
      include: {
        currencyWallet: true,
        internationalPayment: true
      }
    })
  }),
  getProfileInfo: publicProcedure.input(z.object({
    id: z.string()
  })).query(async ({ ctx, input }) => {
    const { id } = input;
    const { prisma } = ctx;

    if (id == 'unauthed') throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Not Authenticated!'
    })

    const account = await prisma.account.findUniqueOrThrow({
      where: {
        id
      },
      include: {
        currencyWallets: true,
        devices: true
      }
    });

    const lastTransactionMade = await prisma.transaction.findFirst({
      where: {
        currencyWallet: {
          accountId: id
        }
      },
      orderBy: {
        time: 'desc'
      }
    })

    if (account.defaultWallet) {
      const defaultWallet = await prisma.currencyWallet.findUniqueOrThrow({
        where: {
          id: account.defaultWallet
        }
      })

      return {
        account,
        lastTransactionMade,
        defaultWallet
      };
    }

    return {
      account,
      lastTransactionMade,
    };
  }),
  setDefaultWallet: publicProcedure.input(z.object({
    walletId: z.string(),
    userId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { walletId, userId } = input;
    const { prisma } = ctx;

    const query = await prisma.account.update({
      where: {
        id: userId
      },
      data: {
        defaultWallet: walletId
      }
    });

    const log = await prisma.log.create({
      data: {
        message: `[DEFAULT WALLET] ${walletId} ${moment().format()}`,
        type: 'MISCELLANEOUS',
        accountId: query.id
      }
    })

    return query;
  }),
  getInternationalPayment: publicProcedure.input(z.object({
    id: z.string()
  })).query(async ({ ctx, input }) => {
    const { prisma } = ctx;
    const { id } = input;

    const internationalPayment = await prisma.internationalPayment.findUniqueOrThrow({
      where: {
        id
      },
      include: {
        receiver: {
          include: {
            account: true
          }
        },
        sender: true
      }
    });

    const { conversion, rate } = await convert(internationalPayment.amountInCurrency1, internationalPayment.sender.currency, internationalPayment.receiver.currency);

    return {
      ...internationalPayment,
      conversion
    };
  }),
  validatePin: publicProcedure.input(z.object({
    id: z.string(),
    pin: z.number()
  })).mutation(async ({ ctx, input }) => {
    const { prisma } = ctx;
    const { id, pin } = input

    const walletInformation = await prisma.currencyWallet.findUniqueOrThrow({
      where: {
        id
      }
    })

    if (walletInformation.pin == pin) return 'true'

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Incorrect Pin Entered!'
    });
  }),
  processInternationalPayment: publicProcedure.input(z.object({
    id: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { id } = input;
    const { prisma } = ctx;

    if (id == 'bad') throw new TRPCError({
      code: 'BAD_REQUEST'
    })

    const internationalPayment = await prisma.internationalPayment.findUniqueOrThrow({
      where: {
        id
      },
      include: {
        sender: true,
        receiver: true
      }
    });

    // CHECK
    const moneyToDeductFromSender = internationalPayment.amountInCurrency1
    const moneyToIncrementToReceiver = internationalPayment.amountInCurrency1 * internationalPayment.exchangeRate1to2;

    const senderWallet = await prisma.currencyWallet.findUniqueOrThrow({
      where: {
        id: internationalPayment.sender.id
      }
    })

    if (senderWallet.balance < moneyToDeductFromSender) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: 'Insufficient Balance'
      })
    }

    // PROCESS
    const deduction = prisma.currencyWallet.update({
      where: {
        id: internationalPayment.sender.id
      },
      data: {
        balance: {
          decrement: moneyToDeductFromSender
        }
      }
    });

    const increment = prisma.currencyWallet.update({
      where: {
        id: internationalPayment.receiver.id
      },
      data: {
        balance: {
          increment: moneyToIncrementToReceiver
        }
      }
    })

    // SETUP TRANSACTION FIELD - MEANS TRANSACTION COMPLETED
    const transactionCompleted = prisma.internationalPayment.update({
      where: {
        id
      },
      data: {
        transaction: {
          create: {
            amount: moneyToDeductFromSender,
            target: `[INTL] ${internationalPayment.sender.currency}_${moneyToIncrementToReceiver} ${moneyToIncrementToReceiver}`
          }
        }
      }
    });

    const log = await prisma.log.create({
      data: {
        message: `[COMPLETE] ${id} ${moment().format()}`,
        type: 'INTL-PAYMENT',
        accountId: senderWallet.id
      }
    })

    const processes = await prisma.$transaction([deduction, increment, transactionCompleted])

    return;
  }),
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
    const validateWallet1 = PayerWallet.balance >= amount
    const validateWallet2 = ReceiverWallet ? true : false

    if (!validateWallet1 || !validateWallet2) {
      console.log(validateWallet1, validateWallet2)
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "Invalid Wallet Data Encountered"
      })
    };

    // do it, do the conversion, and add the amount

    const { conversion, rate } = await convert(amount, PayerWallet.currency, ReceiverWallet.currency);

    const createInternationalPayment = await prisma.internationalPayment.create({
      data: {
        amountInCurrency1: amount,
        exchangeRate1to2: rate,
        sourceId: payerWallet,
        receiverId: receiverWallet,
      }
    })

    const log = await prisma.log.create({
      data: {
        message: `[INITIATE] ${createInternationalPayment.id} ${moment().format()}`,
        type: 'INTL-PAYMENT',
        accountId: payerWallet
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
        message: receiverHasADefaultWallet ? `CAN_DO_INTL ${receiverHasADefaultWallet.id} ${receiverHasADefaultWallet.currency}` : `No ${currency}/Default Wallet found in the Account of the Reciever...`
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

    const log = prisma.log.create({
      data: {
        message: `[LOCAL TRANSACTION] ${amount} ${receiverAccount.id} ${moment().format()}`,
        type: 'LOCAL-PAYMENT',
        accountId: payerWallet.id
      }
    })

    const procedures = await prisma.$transaction([deductAmount, addMoneyToReceiversWallet, createTransaction, log]);

    return procedures[1].currency;
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: money * 100,
      currency,
      payment_method_types: ['card'],
      confirmation_method: "automatic",
    })

    const log = await prisma.log.create({
      data: {
        message: `[NEW WALLET] ${query.id} ${moment().format()}`,
        type: 'MISCELLANEOUS',
        accountId: query.id
      }
    })

    return paymentIntent.client_secret;
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
