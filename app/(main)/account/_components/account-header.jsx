"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";

export default function AccountHeader({ account }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold capitalize">
              {account.name}
            </h1>
            {account.isDefault && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Default Account
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
          </p>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right pb-1">
            <div className="text-xl sm:text-2xl font-bold">
              ₹{parseFloat(account.balance).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              {account._count?.transactions || 0} Transactions
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete Account
          </Button>
        </div>
      </div>

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        accountId={account.id}
        accountName={account.name}
        transactionCount={account._count?.transactions}
        redirectToDashboard={true}
      />
    </>
  );
}
