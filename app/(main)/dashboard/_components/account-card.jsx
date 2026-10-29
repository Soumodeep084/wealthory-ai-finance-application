"use client";

import { ArrowUpRight, ArrowDownRight, MoreVertical, Trash2, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/account";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { toast } from "sonner";

export function AccountCard({ account }) {
    const { name, type, balance, id, isDefault, _count } = account;
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const {
        loading: updateDefaultLoading,
        fn: updateDefaultFn,
        data: updatedAccount,
        error,
    } = useFetch(updateDefaultAccount);

    const handleDefaultChange = async (event) => {
        event.preventDefault(); // Prevent navigation
        event.stopPropagation();

        if (isDefault) {
            toast.warning("You need at least 1 default account");
            return; // Don't allow toggling off the default account
        }

        await updateDefaultFn(id);
    };

    useEffect(() => {
        if (updatedAccount?.success) {
            toast.success("Default account updated successfully");
        }
    }, [updatedAccount]);

    useEffect(() => {
        if (error) {
            toast.error(error.message || "Failed to update default account");
        }
    }, [error]);

    return (
        <>
            <Card className="hover:shadow-md transition-shadow group relative">
                <Link href={`/account/${id}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium capitalize">
                            {name}
                        </CardTitle>
                        <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Switch
                                checked={isDefault}
                                onClick={handleDefaultChange}
                                disabled={updateDefaultLoading}
                                title={isDefault ? "Default Account" : "Set as Default"}
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Account actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/account/${id}`} className="cursor-pointer">
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View Details
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowDeleteDialog(true);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Account
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{parseFloat(balance).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {type.charAt(0) + type.slice(1).toLowerCase()} Account
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                            Income
                        </div>
                        <div className="flex items-center">
                            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                            Expense
                        </div>
                    </CardFooter>
                </Link>
            </Card>

            <DeleteAccountDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                accountId={id}
                accountName={name}
                transactionCount={_count?.transactions}
                redirectToDashboard={false}
            />
        </>
    );
}