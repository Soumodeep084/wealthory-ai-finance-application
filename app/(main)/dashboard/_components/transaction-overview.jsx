"use client";

import { useState, useMemo } from "react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, IndianRupee, Wallet, Calendar, Percent } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = [
    "#4F46E5", // Indigo
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#3B82F6", // Blue
    "#06B6D4", // Cyan
];

export function DashboardOverview({ accounts, transactions }) {
    // 1. Filters state
    const [selectedAccountId, setSelectedAccountId] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedType, setSelectedType] = useState("all"); // "all", "INCOME", "EXPENSE"
    const [selectedSchedule, setSelectedSchedule] = useState("all"); // "all", "one-time", "recurring"
    const [selectedDateRange, setSelectedDateRange] = useState("all"); // "all", "this-month", "last-month", "last-3-months", "last-6-months", "this-year"

    // Get all unique categories from transactions for the category filter dropdown
    const uniqueCategories = useMemo(() => {
        const categories = transactions.map((t) => t.category);
        return ["all", ...new Set(categories.filter(Boolean))];
    }, [transactions]);

    // Parse transaction dates and ensure they are sorted chronologically
    const processedTransactions = useMemo(() => {
        return transactions.map(t => ({
            ...t,
            parsedDate: new Date(t.date),
        })).sort((a, b) => a.parsedDate - b.parsedDate);
    }, [transactions]);

    // 2. Computed Dates
    const dateLimits = useMemo(() => {
        const now = new Date();
        return {
            now,
            startOfThisMonth: startOfMonth(now),
            startOfLastMonth: startOfMonth(subDays(startOfMonth(now), 1)),
            endOfLastMonth: endOfMonth(subDays(startOfMonth(now), 1)),
            last3Months: subDays(now, 90),
            last6Months: subDays(now, 180),
            startOfThisYear: new Date(now.getFullYear(), 0, 1),
        };
    }, []);

    // 3. Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return processedTransactions.filter((t) => {
            // Account Filter
            if (selectedAccountId !== "all" && t.accountId !== selectedAccountId) {
                return false;
            }
            // Category Filter
            if (selectedCategory !== "all" && t.category !== selectedCategory) {
                return false;
            }
            // Type Filter
            if (selectedType !== "all" && t.type !== selectedType) {
                return false;
            }
            // Schedule Filter
            if (selectedSchedule !== "all") {
                const isRecurring = t.isRecurring;
                if (selectedSchedule === "recurring" && !isRecurring) return false;
                if (selectedSchedule === "one-time" && isRecurring) return false;
            }
            // Date Range Filter
            if (selectedDateRange !== "all") {
                const date = t.parsedDate;
                if (selectedDateRange === "this-month" && isBefore(date, dateLimits.startOfThisMonth)) {
                    return false;
                }
                if (selectedDateRange === "last-month") {
                    if (isBefore(date, dateLimits.startOfLastMonth) || isAfter(date, dateLimits.endOfLastMonth)) {
                        return false;
                    }
                }
                if (selectedDateRange === "last-3-months" && isBefore(date, dateLimits.last3Months)) {
                    return false;
                }
                if (selectedDateRange === "last-6-months" && isBefore(date, dateLimits.last6Months)) {
                    return false;
                }
                if (selectedDateRange === "this-year" && isBefore(date, dateLimits.startOfThisYear)) {
                    return false;
                }
            }
            return true;
        });
    }, [processedTransactions, selectedAccountId, selectedCategory, selectedType, selectedSchedule, selectedDateRange, dateLimits]);

    // 4. Comparison Calculations (This Month vs Last Month)
    const comparisonStats = useMemo(() => {
        const baseFiltered = processedTransactions.filter((t) => {
            if (selectedAccountId !== "all" && t.accountId !== selectedAccountId) return false;
            if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
            if (selectedSchedule !== "all") {
                if (selectedSchedule === "recurring" && !t.isRecurring) return false;
                if (selectedSchedule === "one-time" && t.isRecurring) return false;
            }
            return true;
        });

        const thisMonth = baseFiltered.filter(t => t.parsedDate >= dateLimits.startOfThisMonth);
        const lastMonth = baseFiltered.filter(t => t.parsedDate >= dateLimits.startOfLastMonth && t.parsedDate <= dateLimits.endOfLastMonth);

        const getIncomeAndExpense = (list) => {
            let income = 0;
            let expense = 0;
            list.forEach(t => {
                if (t.type === "INCOME") income += t.amount;
                else if (t.type === "EXPENSE") expense += t.amount;
            });
            return { income, expense, savings: income - expense };
        };

        const thisMonthTotals = getIncomeAndExpense(thisMonth);
        const lastMonthTotals = getIncomeAndExpense(lastMonth);

        const calcPercentChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / Math.abs(previous)) * 100;
        };

        return {
            thisMonth: thisMonthTotals,
            lastMonth: lastMonthTotals,
            incomeChange: calcPercentChange(thisMonthTotals.income, lastMonthTotals.income),
            expenseChange: calcPercentChange(thisMonthTotals.expense, lastMonthTotals.expense),
            savingsChange: calcPercentChange(thisMonthTotals.savings, lastMonthTotals.savings),
        };
    }, [processedTransactions, selectedAccountId, selectedCategory, selectedSchedule, dateLimits]);

    // 5. KPI Cards Calculations for Filtered dataset
    const kpis = useMemo(() => {
        let income = 0;
        let expense = 0;
        const categoryMap = {};

        filteredTransactions.forEach((t) => {
            if (t.type === "INCOME") {
                income += t.amount;
            } else if (t.type === "EXPENSE") {
                expense += t.amount;
                categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
            }
        });

        let topCategory = "N/A";
        let topCategoryAmount = 0;
        Object.entries(categoryMap).forEach(([cat, val]) => {
            if (val > topCategoryAmount) {
                topCategory = cat;
                topCategoryAmount = val;
            }
        });

        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        return {
            income,
            expense,
            savings,
            savingsRate,
            topCategory,
            topCategoryAmount,
        };
    }, [filteredTransactions]);

    // 6. Trend Chart Data (Group by Date or Month)
    const trendData = useMemo(() => {
        if (filteredTransactions.length === 0) return [];

        const firstDate = filteredTransactions[0].parsedDate;
        const lastDate = filteredTransactions[filteredTransactions.length - 1].parsedDate;
        const diffDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));

        const groupFormat = diffDays <= 45 ? "MMM dd" : "MMM yyyy";
        const groups = {};

        filteredTransactions.forEach((t) => {
            const key = format(t.parsedDate, groupFormat);
            if (!groups[key]) {
                groups[key] = { name: key, Income: 0, Expenses: 0 };
            }
            if (t.type === "INCOME") {
                groups[key].Income += t.amount;
            } else if (t.type === "EXPENSE") {
                groups[key].Expenses += t.amount;
            }
        });

        return Object.values(groups);
    }, [filteredTransactions]);

    // 7. Pie Chart Data (Category Breakdown)
    const pieChartData = useMemo(() => {
        const categories = {};
        filteredTransactions.forEach((t) => {
            if (t.type === "EXPENSE") {
                categories[t.category] = (categories[t.category] || 0) + t.amount;
            }
        });

        return Object.entries(categories).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
            value,
        })).sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    // 8. Monthly Income vs Expenses (Bar Chart)
    const monthlyComparisonData = useMemo(() => {
        const groups = {};
        processedTransactions.forEach((t) => {
            if (selectedAccountId !== "all" && t.accountId !== selectedAccountId) return;
            if (selectedCategory !== "all" && t.category !== selectedCategory) return;
            if (selectedSchedule !== "all") {
                if (selectedSchedule === "recurring" && !t.isRecurring) return;
                if (selectedSchedule === "one-time" && t.isRecurring) return;
            }

            const monthKey = format(t.parsedDate, "MMM yyyy");
            if (!groups[monthKey]) {
                groups[monthKey] = { name: monthKey, Income: 0, Expenses: 0, dateObj: t.parsedDate };
            }
            if (t.type === "INCOME") {
                groups[monthKey].Income += t.amount;
            } else if (t.type === "EXPENSE") {
                groups[monthKey].Expenses += t.amount;
            }
        });

        return Object.values(groups)
            .sort((a, b) => a.dateObj - b.dateObj)
            .slice(-6);
    }, [processedTransactions, selectedAccountId, selectedCategory, selectedSchedule]);

    const formatCategoryName = (name) => {
        if (!name || name === "N/A") return "N/A";
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
    };

    return (
        <>
            {/* Screen UI Layout */}
            <div className="space-y-6 mb-8 print:hidden">
                {/* Filters Bar */}
                <Card className="p-4 shadow-sm bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                    <div className="flex items-center mb-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <Calendar className="h-4 w-4 text-indigo-600" />
                            <span>Analytics Filters</span>
                        </div>
                        
                    </div>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                        {/* Account */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Account</label>
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950">
                                    <SelectValue placeholder="All Accounts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Accounts</SelectItem>
                                    {accounts.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Date Range</label>
                            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950">
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="this-month">This Month</SelectItem>
                                    <SelectItem value="last-month">Last Month</SelectItem>
                                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                                    <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                                    <SelectItem value="this-year">This Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Category</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {uniqueCategories.filter(cat => cat !== "all").map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {formatCategoryName(cat)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Flow */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Flow</label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950">
                                    <SelectValue placeholder="All Flows" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All (In/Out)</SelectItem>
                                    <SelectItem value="INCOME">Income Only</SelectItem>
                                    <SelectItem value="EXPENSE">Expense Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Schedule */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Schedule</label>
                            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950">
                                    <SelectValue placeholder="All Schedules" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Schedules</SelectItem>
                                    <SelectItem value="one-time">One-time</SelectItem>
                                    <SelectItem value="recurring">Recurring</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* KPI Metrics Cards */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {/* Income Card */}
                    <Card className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm hover:shadow transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                            <IndianRupee className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                ₹{kpis.income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                                {comparisonStats.incomeChange >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3 text-rose-500" />
                                )}
                                <span className={cn("text-xs font-medium", comparisonStats.incomeChange >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {comparisonStats.incomeChange >= 0 ? "+" : ""}{comparisonStats.incomeChange.toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-muted-foreground">vs last month</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expense Card */}
                    <Card className="overflow-hidden border-l-4 border-l-rose-500 shadow-sm hover:shadow transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                            <Wallet className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                ₹{kpis.expense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                                {comparisonStats.expenseChange <= 0 ? (
                                    <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                                ) : (
                                    <ArrowUpRight className="h-3 w-3 text-rose-500" />
                                )}
                                <span className={cn("text-xs font-medium", comparisonStats.expenseChange <= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {comparisonStats.expenseChange >= 0 ? "+" : ""}{comparisonStats.expenseChange.toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-muted-foreground">vs last month</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Savings Card */}
                    <Card className="overflow-hidden border-l-4 border-l-indigo-500 shadow-sm hover:shadow transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", kpis.savings >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600")}>
                                ₹{kpis.savings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                                    {kpis.savingsRate.toFixed(1)}% Rate
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {comparisonStats.savingsChange >= 0 ? "Up" : "Down"} vs last month
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top spending category */}
                    <Card className="overflow-hidden border-l-4 border-l-amber-500 shadow-sm hover:shadow transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Top Expense Category</CardTitle>
                            <Percent className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold truncate text-slate-900 dark:text-white" title={formatCategoryName(kpis.topCategory)}>
                                {formatCategoryName(kpis.topCategory)}
                            </div>
                            <div className="mt-1.5 text-xs text-muted-foreground">
                                {kpis.topCategoryAmount > 0 ? (
                                    <>
                                        Accumulated{" "}
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            ₹{kpis.topCategoryAmount.toFixed(2)}
                                        </span>
                                    </>
                                ) : (
                                    "No expenses recorded"
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Spending trend Area chart */}
                    <Card className="md:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Spending & Income Trend</CardTitle>
                            <CardDescription>Visualizing cash inflow and outflow over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {trendData.length === 0 ? (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    No transaction data available for this range
                                </div>
                            ) : (
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                                            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                formatter={(value) => `₹${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                contentStyle={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                    border: "1px solid #E2E8F0",
                                                    borderRadius: "8px",
                                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                                                }}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            <Area type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                                            <Area type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pie Chart breakdown */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle>
                            <CardDescription>Grouping expenses by category</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            {pieChartData.length === 0 ? (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-center">
                                    No expense data found
                                </div>
                            ) : (
                                <>
                                    <div className="h-[240px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {pieChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `₹ ${value.toFixed(2)}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 w-full max-h-[100px] overflow-y-auto space-y-1.5 px-2">
                                        {pieChartData.slice(0, 5).map((item, idx) => (
                                            <div key={item.name} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                    <span className="truncate font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                                                </div>
                                                <span className="font-semibold text-slate-900 dark:text-white">₹{item.value.toFixed(2)}</span>
                                            </div>
                                        ))}
                                        {pieChartData.length > 5 && (
                                            <div className="text-[10px] text-center text-muted-foreground italic pt-1">
                                                + {pieChartData.length - 5} more categories
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Monthly Comparisons Bar Chart */}
                    <Card className="md:col-span-3 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Monthly Comparison (Last 6 Months)</CardTitle>
                            <CardDescription>Historical overview of income vs expenses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {monthlyComparisonData.length === 0 ? (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                    No historical monthly comparisons available
                                </div>
                            ) : (
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                                            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                formatter={(value) => `₹${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                contentStyle={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                    border: "1px solid #E2E8F0",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} />
                                            <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}