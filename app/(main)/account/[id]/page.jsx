import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/account";
import { notFound } from "next/navigation";
import { BarLoader } from "react-spinners";
import TransactionTable from "../_components/transaction-table";
import { AccountChart } from "../_components/account-chart";
import { AccountCategoryChart } from "../_components/account-category-chart";
import AccountHeader from "../_components/account-header";

export default async function AccountPage({ params }) {
    const { id } = await params;

    // Fetch account data with transactions
    // This function should be defined in your actions/account.js file
    const accountData = await getAccountWithTransactions(id);


    if (!accountData) {
        notFound();
    }

    const { transactions, ...account } = accountData;

    return (
        <div className="space-y-8 px-5">
            <AccountHeader account={account} />

            {/* Visualizations Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />} >
                    <AccountChart transactions={transactions} />
                </Suspense>

                <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />} >
                    <AccountCategoryChart transactions={transactions} />
                </Suspense>
            </div>

            {/* Transactions Table */}
            <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />} >
                <TransactionTable transactions={transactions} />
            </Suspense>
        </div>
    );

}