import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Initial balance is required"),
  isDefault: z.boolean().default(false),
});

const amountSchema = z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? val : num;
  },
  z.number({ required_error: "Amount is required" }).positive("Amount must be positive")
);

const dateSchema = z.preprocess(
  (val) => {
    if (typeof val === "string") return new Date(val);
    return val;
  },
  z.date({ required_error: "Date is required" })
);

const transactionBaseSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: amountSchema,
  description: z.string().optional().nullable(),
  accountId: z.string().min(1, "Account is required"),
  category: z.string().min(1, "Category is required"),
  isRecurring: z.boolean().default(false),
  recurringInterval: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .optional()
    .or(z.literal("")),
});

export const transactionSchema = transactionBaseSchema
  .extend({
    date: dateSchema,
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required",
        path: ["recurringInterval"],
      });
    }
  });

export const bulkTransactionItemSchema = transactionBaseSchema
  .extend({
    date: dateSchema,
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });

export const bulkTransactionSchema = z.object({
  date: dateSchema.optional(),
  transactions: z
    .array(bulkTransactionItemSchema)
    .min(1, "At least one transaction is required"),
});