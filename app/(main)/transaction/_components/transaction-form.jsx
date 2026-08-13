"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CalendarIcon,
    ChevronDown,
    ChevronUp,
    Loader2,
    Plus,
    Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { cn } from "@/lib/utils";
import {
    createBulkTransactions,
    updateTransaction,
} from "@/actions/transaction";
import {
    transactionSchema,
    bulkTransactionSchema,
} from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";

export function AddTransactionForm({
    accounts,
    categories,
    editMode = false,
    initialData = null,
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const [openExpense, setOpenExpense] = useState(0);

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        reset,
    } = useForm({
        resolver: zodResolver(
            editMode ? transactionSchema : bulkTransactionSchema
        ),
        defaultValues:
            editMode && initialData
                ? {
                    type: initialData.type,
                    amount: initialData.amount.toString(),
                    description: initialData.description || "",
                    accountId: initialData.accountId,
                    category: initialData.category,
                    date: new Date(initialData.date),
                    isRecurring: initialData.isRecurring,
                    recurringInterval:
                        initialData.recurringInterval || "",
                }
                : {
                    date: new Date(),
                    transactions: [
                        {
                            type: "EXPENSE",
                            amount: "",
                            description: "",
                            accountId:
                                accounts.find(
                                    (account) => account.isDefault
                                )?.id || "",
                            category: "",
                            isRecurring: false,
                            recurringInterval: "",
                        },
                    ],
                },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "transactions",
    });

    const {
        loading: transactionLoading,
        fn: transactionFn,
        data: transactionResult,
    } = useFetch(
        editMode ? updateTransaction : createBulkTransactions
    );

    const date = watch("date");
    const transactions = watch("transactions");

    const addTransaction = () => {
        append({
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId:
                accounts.find((account) => account.isDefault)?.id || "",
            category: "",
            isRecurring: false,
            recurringInterval: "",
        });

        setOpenExpense(fields.length);
    };

    const onSubmit = (data) => {
        if (editMode) {
            transactionFn(editId, {
                ...data,
                amount: parseFloat(data.amount),
            });
            return;
        }

        transactionFn({
            date: data.date,
            transactions: data.transactions.map((transaction) => ({
                ...transaction,
                amount: parseFloat(transaction.amount),
            })),
        });
    };

    const onInvalid = (errors) => {
        toast.error(`Fields Missing : ${errors}`)
        toast.error("Please fill in all required fields");
    };

    const handleScanComplete = (scannedData) => {
        if (!scannedData) return;

        setValue(
            "transactions.0.amount",
            scannedData.amount?.toString() || ""
        );

        if (scannedData.description) {
            setValue(
                "transactions.0.description",
                scannedData.description
            );
        }

        if (scannedData.category) {
            setValue(
                "transactions.0.category",
                scannedData.category
            );
        }

        toast.success("Receipt scanned successfully");
    };

    useEffect(() => {
        if (transactionResult?.success && !transactionLoading) {
            if (editMode) {
                toast.success("Transaction updated successfully");
                reset();
                router.push(
                    `/account/${transactionResult.data.accountId}`
                );
            } else {
                toast.success(
                    `${transactionResult.data.length} transaction${transactionResult.data.length > 1 ? "s" : ""
                    } created successfully`
                );
                reset();
                router.push(
                    `/account/${transactionResult.data[0].accountId}`
                );
            }
        }
    }, [
        transactionResult,
        transactionLoading,
        editMode,
        reset,
        router,
    ]);

    const handleRemove = (index) => {
        remove(index);

        if (openExpense === index) {
            setOpenExpense(
                index > 0 ? index - 1 : fields.length > 1 ? 1 : null
            );
        } else if (openExpense > index) {
            setOpenExpense(openExpense - 1);
        }
    };

    if (editMode) {
        return (
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
            >
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Date
                    </label>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                {date ? (
                                    format(date, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}

                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent
                            className="w-auto p-0"
                            align="start"
                        >
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(value) =>
                                    setValue("date", value, {
                                        shouldValidate: true,
                                    })
                                }
                                disabled={(value) =>
                                    value > new Date() ||
                                    value < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {errors.date && (
                        <p className="text-sm text-red-500">
                            {errors.date.message}
                        </p>
                    )}
                </div>

                <TransactionFields
                    prefix=""
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    accounts={accounts}
                    categories={categories}
                />

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-1/2"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        className="w-1/2"
                        disabled={transactionLoading}
                    >
                        {transactionLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Transaction"
                        )}
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-6"
        >
            <ReceiptScanner
                onScanComplete={handleScanComplete}
            />

            <div className="space-y-2">
                <label className="text-sm font-medium">
                    Date
                </label>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            {date ? (
                                format(date, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}

                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent
                        className="w-auto p-0"
                        align="start"
                    >
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(value) =>
                                setValue("date", value, {
                                    shouldValidate: true,
                                })
                            }
                            disabled={(value) =>
                                value > new Date() ||
                                value < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {errors.date && (
                    <p className="text-sm text-red-500">
                        {errors.date.message}
                    </p>
                )}
            </div>

            <div className="space-y-3">
                {fields.map((field, index) => {
                    const transaction = transactions?.[index] || {};

                    const type =
                        transaction.type === "INCOME"
                            ? "Income"
                            : "Expense";

                    const typeNumber =
                        transactions
                            ?.slice(0, index + 1)
                            .filter((item) => item?.type === transaction.type)
                            .length || 1;

                    const amount = transaction.amount
                        ? `₹${transaction.amount}`
                        : "₹0.00";

                    const description =
                        transaction.description?.trim();

                    const isOpen = openExpense === index;

                    return (
                        <div
                            key={field.id}
                            className={cn(
                                "overflow-hidden rounded-xl border transition-all",
                                isOpen && "shadow-sm"
                            )}
                        >
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                    setOpenExpense(
                                        isOpen ? null : index
                                    )
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                    ) {
                                        event.preventDefault();
                                        setOpenExpense(
                                            isOpen ? null : index
                                        );
                                    }
                                }}
                                className="flex cursor-pointer items-center gap-3 p-4 hover:bg-muted/50"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">
                                            {type} #{typeNumber}
                                        </h3>

                                        {transaction.isRecurring && (
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                                Recurring
                                            </span>
                                        )}
                                    </div>

                                    <p className="truncate text-sm text-muted-foreground">
                                        {type} - {amount}
                                        {description
                                            ? ` , ${description}`
                                            : ""}
                                    </p>
                                </div>

                                <div
                                    className="flex shrink-0 items-center gap-1"
                                    onClick={(event) =>
                                        event.stopPropagation()
                                    }
                                >
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                            onClick={() =>
                                                handleRemove(index)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setOpenExpense(
                                                isOpen ? null : index
                                            )
                                        }
                                    >
                                        {isOpen ? (
                                            <ChevronUp className="h-5 w-5" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="border-t p-5">
                                    <TransactionFields
                                        prefix={`transactions.${index}`}
                                        register={register}
                                        watch={watch}
                                        setValue={setValue}
                                        errors={
                                            errors.transactions?.[index] || {}
                                        }
                                        accounts={accounts}
                                        categories={categories}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={addTransaction}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Transaction
            </Button>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="w-1/2"
                    onClick={() => router.back()}
                    disabled={transactionLoading}
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    className="w-1/2"
                    disabled={transactionLoading}
                >
                    {transactionLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        `Create ${fields.length > 1
                            ? `${fields.length} Transactions`
                            : "Transaction"
                        }`
                    )}
                </Button>
            </div>
        </form>
    );
}

function TransactionFields({
    prefix,
    register,
    watch,
    setValue,
    errors,
    accounts,
    categories,
}) {
    const field = (name) =>
        prefix ? `${prefix}.${name}` : name;

    const type = watch(field("type")) || "EXPENSE";
    const isRecurring =
        watch(field("isRecurring")) || false;
    const accountId =
        watch(field("accountId")) || "";
    const category =
        watch(field("category")) || "";
    const recurringInterval =
        watch(field("recurringInterval")) || "";

    const filteredCategories = categories.filter(
        (category) => category.type === type
    );

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <label className="text-sm font-medium">
                    Type
                </label>

                <Select
                    value={type}
                    onValueChange={(value) => {
                        setValue(field("type"), value, {
                            shouldValidate: true,
                        });
                        setValue(field("category"), "", {
                            shouldValidate: true,
                        });
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="EXPENSE">
                            Expense
                        </SelectItem>
                        <SelectItem value="INCOME">
                            Income
                        </SelectItem>
                    </SelectContent>
                </Select>

                {errors?.type && (
                    <p className="text-sm text-red-500">
                        {errors.type.message}
                    </p>
                )}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Amount
                    </label>

                    <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register(field("amount"))}
                    />

                    {errors?.amount && (
                        <p className="text-sm text-red-500">
                            {errors.amount.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Account
                    </label>

                    <Select
                        value={accountId}
                        onValueChange={(value) =>
                            setValue(
                                field("accountId"),
                                value,
                                {
                                    shouldValidate: true,
                                }
                            )
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account" />
                        </SelectTrigger>

                        <SelectContent>
                            {accounts.map((account) => (
                                <SelectItem
                                    key={account.id}
                                    value={account.id}
                                >
                                    {account.name} ($
                                    {parseFloat(
                                        account.balance
                                    ).toFixed(2)}
                                    )
                                </SelectItem>
                            ))}

                            <CreateAccountDrawer>
                                <Button
                                    variant="ghost"
                                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                >
                                    Create Account
                                </Button>
                            </CreateAccountDrawer>
                        </SelectContent>
                    </Select>

                    {errors?.accountId && (
                        <p className="text-sm text-red-500">
                            {errors.accountId.message}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">
                    Category
                </label>

                <Select
                    value={category}
                    onValueChange={(value) =>
                        setValue(
                            field("category"),
                            value,
                            {
                                shouldValidate: true,
                            }
                        )
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>

                    <SelectContent>
                        {filteredCategories.map((category) => (
                            <SelectItem
                                key={category.id}
                                value={category.id}
                            >
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {errors?.category && (
                    <p className="text-sm text-red-500">
                        {errors.category.message}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">
                    Description
                </label>

                <Input
                    placeholder="Enter description"
                    {...register(field("description"))}
                />

                {errors?.description && (
                    <p className="text-sm text-red-500">
                        {errors.description.message}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <label className="text-base font-medium">
                        Recurring Transaction
                    </label>

                    <div className="text-sm text-muted-foreground">
                        Set up a recurring schedule for this transaction
                    </div>
                </div>

                <Switch
                    checked={isRecurring}
                    onCheckedChange={(checked) => {
                        setValue(
                            field("isRecurring"),
                            checked,
                            {
                                shouldValidate: true,
                            }
                        );

                        if (!checked) {
                            setValue(
                                field("recurringInterval"),
                                "",
                                {
                                    shouldValidate: true,
                                }
                            );
                        }
                    }}
                />
            </div>

            {isRecurring && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Recurring Interval
                    </label>

                    <Select
                        value={recurringInterval}
                        onValueChange={(value) =>
                            setValue(
                                field("recurringInterval"),
                                value,
                                {
                                    shouldValidate: true,
                                }
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="DAILY">
                                Daily
                            </SelectItem>
                            <SelectItem value="WEEKLY">
                                Weekly
                            </SelectItem>
                            <SelectItem value="MONTHLY">
                                Monthly
                            </SelectItem>
                            <SelectItem value="YEARLY">
                                Yearly
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {errors?.recurringInterval && (
                        <p className="text-sm text-red-500">
                            {errors.recurringInterval.message}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}