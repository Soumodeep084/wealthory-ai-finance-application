"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { defaultCategories, categoryColors } from "@/data/categories";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, PieChart as PieIcon } from "lucide-react";

const DATE_RANGES = {
  ALL: { label: "All Time", days: null },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  "7D": { label: "Last 7 Days", days: 7 },
};

function getCategoryInfo(categoryId) {
  const found = defaultCategories.find(
    (c) => c.id.toLowerCase() === categoryId?.toLowerCase()
  );
  if (found) {
    return { name: found.name, color: found.color };
  }
  const formattedName = categoryId
    ? categoryId
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Uncategorized";
  return {
    name: formattedName,
    color: categoryColors[categoryId] || "#94a3b8",
  };
}

function CustomTooltip({ active, payload, totalAmount }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage =
      totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) : 0;

    return (
      <div className="rounded-lg border bg-popover p-2.5 shadow-md text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-popover-foreground">
            {data.name}
          </span>
        </div>
        <div className="text-muted-foreground">
          Amount:{" "}
          <strong className="text-popover-foreground">
            ₹
            {data.amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>
        <div className="text-muted-foreground">
          Share:{" "}
          <strong className="text-popover-foreground">{percentage}%</strong>{" "}
          ({data.count} {data.count === 1 ? "transaction" : "transactions"})
        </div>
      </div>
    );
  }
  return null;
}

export function AccountCategoryChart({ transactions }) {
  const [selectedType, setSelectedType] = useState("EXPENSE");
  const [dateRange, setDateRange] = useState("ALL");

  // Filter transactions by date range
  const dateFilteredTransactions = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    if (!range?.days) return transactions;

    const now = new Date();
    const startDate = startOfDay(subDays(now, range.days));
    const endDate = endOfDay(now);

    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });
  }, [transactions, dateRange]);

  // Aggregate category data only for categories that have at least 1 transaction
  const categoryData = useMemo(() => {
    const typeFiltered = dateFilteredTransactions.filter(
      (t) => t.type === selectedType
    );

    const categoryMap = {};

    for (const t of typeFiltered) {
      const catId = t.category || "other";
      const amount = Number(t.amount);

      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          id: catId,
          amount: 0,
          count: 0,
        };
      }
      categoryMap[catId].amount += amount;
      categoryMap[catId].count += 1;
    }

    // Only include categories with count > 0 and amount > 0; hide all others
    return Object.values(categoryMap)
      .filter((item) => item.count > 0 && item.amount > 0)
      .map((item) => {
        const info = getCategoryInfo(item.id);
        return {
          id: item.id,
          name: info.name,
          color: info.color,
          amount: item.amount,
          count: item.count,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [dateFilteredTransactions, selectedType]);

  const totalAmount = useMemo(() => {
    return categoryData.reduce((acc, item) => acc + item.amount, 0);
  }, [categoryData]);

  // Count active categories for badge indicators
  const activeExpenseCount = useMemo(() => {
    const cats = new Set(
      dateFilteredTransactions
        .filter((t) => t.type === "EXPENSE" && Number(t.amount) > 0)
        .map((t) => t.category)
    );
    return cats.size;
  }, [dateFilteredTransactions]);

  const activeIncomeCount = useMemo(() => {
    const cats = new Set(
      dateFilteredTransactions
        .filter((t) => t.type === "INCOME" && Number(t.amount) > 0)
        .map((t) => t.category)
    );
    return cats.size;
  }, [dateFilteredTransactions]);

  const isExpense = selectedType === "EXPENSE";

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              Category Breakdown
            </CardTitle>
            <CardDescription>
              {isExpense ? "Expense" : "Income"} distribution for this account
            </CardDescription>
          </div>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[130px] h-8 text-xs">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type Selector Toggle: Expense vs Income */}
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          <Button
            type="button"
            variant={isExpense ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedType("EXPENSE")}
            className={cn(
              "flex-1 h-8 text-xs font-medium gap-1.5",
              isExpense
                ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            Expenses ({activeExpenseCount})
          </Button>
          <Button
            type="button"
            variant={!isExpense ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedType("INCOME")}
            className={cn(
              "flex-1 h-8 text-xs font-medium gap-1.5",
              !isExpense
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Income ({activeIncomeCount})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        {categoryData.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
            <PieIcon className="h-10 w-10 stroke-[1.2] mb-2 opacity-40" />
            <p className="text-sm font-medium">
              No {isExpense ? "expense" : "income"} transactions
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs">
              Categories will only appear here once transactions of this type
              are added to this account.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut Chart with Centered Total */}
            <div className="relative h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={categoryData.length > 1 ? 3 : 0}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={`cell-${entry.id}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip totalAmount={totalAmount} />}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Total overlay in donut hole */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Total
                </span>
                <span className="text-sm font-bold text-foreground">
                  ₹
                  {totalAmount.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>

            {/* Active Categories List - only shows categories with >0 transactions */}
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {categoryData.map((item) => {
                const percentage =
                  totalAmount > 0
                    ? ((item.amount / totalAmount) * 100).toFixed(1)
                    : 0;

                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium truncate">
                          {item.name}
                        </span>
                        <span className="text-muted-foreground text-[10px] shrink-0">
                          ({item.count})
                        </span>
                      </div>
                      <div className="text-right shrink-0 font-medium">
                        <span>
                          ₹
                          {item.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-muted-foreground text-[10px] ml-1">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Visual Proportional Bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

