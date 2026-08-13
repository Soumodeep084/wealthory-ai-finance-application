"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { transactionSchema, bulkTransactionSchema } from "@/app/lib/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const serializeAmount = (obj) => ({
    ...obj,
    amount: obj.amount.toNumber(),
});

export async function createTransaction(data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const req = await request();

        const decision = await aj.protect(req, {
            userId,
            requested: 1,
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                throw new Error("Too many requests. Please try again later.");
            }

            throw new Error("Request blocked");
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const validatedData = transactionSchema.parse(data);

        const account = await db.account.findUnique({
            where: {
                id: validatedData.accountId,
                userId: user.id,
            },
        });

        if (!account) {
            throw new Error("Account not found");
        }

        const balanceChange =
            validatedData.type === "EXPENSE" ? -validatedData.amount : validatedData.amount;

        const transaction = await db.$transaction(async (tx) => {
            const newTransaction = await tx.transaction.create({
                data: {
                    type: validatedData.type,
                    amount: validatedData.amount,
                    description: validatedData.description || null,
                    date: validatedData.date,
                    category: validatedData.category,
                    accountId: validatedData.accountId,
                    userId: user.id,
                    isRecurring: validatedData.isRecurring,
                    recurringInterval: validatedData.isRecurring
                        ? validatedData.recurringInterval
                        : null,
                    nextRecurringDate:
                        validatedData.isRecurring && validatedData.recurringInterval
                            ? calculateNextRecurringDate(
                                validatedData.date,
                                validatedData.recurringInterval
                            )
                            : null,
                },
            });

            await tx.account.update({
                where: { id: validatedData.accountId },
                data: {
                    balance: {
                        increment: balanceChange,
                    },
                },
            });

            return newTransaction;
        }, {
            timeout: 15000,
        });

        revalidatePath("/dashboard");
        revalidatePath(`/account/${transaction.accountId}`);

        return {
            success: true,
            data: serializeAmount(transaction),
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function createBulkTransactions(data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const req = await request();

        const decision = await aj.protect(req, {
            userId,
            requested: 1,
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                throw new Error("Too many requests. Please try again later.");
            }

            throw new Error("Request blocked");
        }

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const validatedData = bulkTransactionSchema.parse(data);

        if (!validatedData.transactions?.length) {
            throw new Error("At least one transaction is required");
        }

        const accountIds = [
            ...new Set(
                validatedData.transactions.map(
                    (transaction) => transaction.accountId
                )
            ),
        ];

        const transactions = await db.$transaction(async (tx) => {
            const accounts = await tx.account.findMany({
                where: {
                    id: {
                        in: accountIds,
                    },
                    userId: user.id,
                },
            });

            if (accounts.length !== accountIds.length) {
                throw new Error("One or more accounts not found");
            }

            const balanceChanges = {};

            for (const transaction of validatedData.transactions) {
                const amount = Number(transaction.amount);

                if (!Number.isFinite(amount) || amount <= 0) {
                    throw new Error("Invalid transaction amount");
                }

                const change =
                    transaction.type === "EXPENSE"
                        ? -amount
                        : amount;

                balanceChanges[transaction.accountId] =
                    (balanceChanges[transaction.accountId] || 0) + change;
            }

            await Promise.all(
                accountIds.map((accountId) =>
                    tx.account.update({
                        where: {
                            id: accountId,
                        },
                        data: {
                            balance: {
                                increment: balanceChanges[accountId] || 0,
                            },
                        },
                    })
                )
            );

            const createdTransactions = await Promise.all(
                validatedData.transactions.map((transaction) =>
                    tx.transaction.create({
                        data: {
                            type: transaction.type,
                            amount: Number(transaction.amount),
                            description: transaction.description || null,
                            date: validatedData.date,
                            category: transaction.category,
                            accountId: transaction.accountId,
                            userId: user.id,
                            isRecurring: transaction.isRecurring,
                            recurringInterval:
                                transaction.isRecurring
                                    ? transaction.recurringInterval
                                    : null,
                            nextRecurringDate:
                                transaction.isRecurring &&
                                    transaction.recurringInterval
                                    ? calculateNextRecurringDate(
                                        validatedData.date,
                                        transaction.recurringInterval
                                    )
                                    : null,
                        },
                    })
                )
            );

            return createdTransactions;
        }, {
            timeout: 20000,
        });

        revalidatePath("/dashboard");

        for (const accountId of accountIds) {
            revalidatePath(`/account/${accountId}`);
        }

        return {
            success: true,
            data: transactions.map(serializeAmount),
        };
    } catch (error) {
        console.error("Bulk transaction error:", error);
        throw new Error(error.message || "Failed to create transactions");
    }
}

export async function getTransaction(id) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    });

    if (!user) throw new Error("User not found");

    const transaction = await db.transaction.findUnique({
        where: {
            id,
            userId: user.id,
        },
    });

    if (!transaction) throw new Error("Transaction not found");

    return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });

        if (!user) throw new Error("User not found");

        const originalTransaction = await db.transaction.findUnique({
            where: {
                id,
                userId: user.id,
            },
            include: {
                account: true,
            },
        });

        if (!originalTransaction) {
            throw new Error("Transaction not found");
        }

        const validatedData = transactionSchema.parse(data);

        const oldBalanceChange =
            originalTransaction.type === "EXPENSE"
                ? -originalTransaction.amount.toNumber()
                : originalTransaction.amount.toNumber();

        const newBalanceChange =
            validatedData.type === "EXPENSE" ? -validatedData.amount : validatedData.amount;

        const netBalanceChange = newBalanceChange - oldBalanceChange;

        const transaction = await db.$transaction(async (tx) => {
            const updated = await tx.transaction.update({
                where: {
                    id,
                    userId: user.id,
                },
                data: {
                    type: validatedData.type,
                    amount: validatedData.amount,
                    description: validatedData.description || null,
                    date: validatedData.date,
                    category: validatedData.category,
                    accountId: validatedData.accountId,
                    isRecurring: validatedData.isRecurring,
                    recurringInterval: validatedData.isRecurring
                        ? validatedData.recurringInterval
                        : null,
                    nextRecurringDate:
                        validatedData.isRecurring && validatedData.recurringInterval
                            ? calculateNextRecurringDate(
                                validatedData.date,
                                validatedData.recurringInterval
                            )
                            : null,
                },
            });

            if (originalTransaction.accountId === validatedData.accountId) {
                await tx.account.update({
                    where: {
                        id: validatedData.accountId,
                    },
                    data: {
                        balance: {
                            increment: netBalanceChange,
                        },
                    },
                });
            } else {
                await tx.account.update({
                    where: {
                        id: originalTransaction.accountId,
                    },
                    data: {
                        balance: {
                            increment: -oldBalanceChange,
                        },
                    },
                });

                await tx.account.update({
                    where: {
                        id: validatedData.accountId,
                    },
                    data: {
                        balance: {
                            increment: newBalanceChange,
                        },
                    },
                });
            }

            return updated;
        }, {
            timeout: 15000,
        });

        revalidatePath("/dashboard");
        revalidatePath(`/account/${originalTransaction.accountId}`);
        if (originalTransaction.accountId !== validatedData.accountId) {
            revalidatePath(`/account/${validatedData.accountId}`);
        }

        return {
            success: true,
            data: serializeAmount(transaction),
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function getUserTransactions(query = {}) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const transactions = await db.transaction.findMany({
            where: {
                userId: user.id,
                ...query,
            },
            include: {
                account: true,
            },
            orderBy: {
                date: "desc",
            },
        });

        return {
            success: true,
            data: transactions,
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function scanReceipt(file) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        const arrayBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString("base64");

        const prompt = `
Analyze this receipt image and extract the following information in JSON format:
- Total amount (just the number)
- Date (in ISO format)
- Description or items purchased (brief summary)
- Merchant/store name
- Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense)

Only respond with valid JSON in this exact format:
{
  "amount": number,
  "date": "ISO date string",
  "description": "string",
  "merchantName": "string",
  "category": "string"
}

If its not a recipt, return an empty object
`;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64String,
                    mimeType: file.type,
                },
            },
            prompt,
        ]);

        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        try {
            const data = JSON.parse(cleanedText);

            return {
                amount: parseFloat(data.amount),
                date: new Date(data.date),
                description: data.description,
                category: data.category,
                merchantName: data.merchantName,
            };
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            throw new Error("Invalid response format from Gemini");
        }
    } catch (error) {
        console.error("Error scanning receipt:", error);
        throw new Error("Failed to scan receipt");
    }
}

function calculateNextRecurringDate(startDate, interval) {
    const date = new Date(startDate);

    switch (interval) {
        case "DAILY":
            date.setDate(date.getDate() + 1);
            break;
        case "WEEKLY":
            date.setDate(date.getDate() + 7);
            break;
        case "MONTHLY":
            date.setMonth(date.getMonth() + 1);
            break;
        case "YEARLY":
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date;
}