"use client";

import { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/use-fetch";
import { deleteAccount } from "@/actions/account";

function generateVerificationCode() {
  const randomNum = Math.floor(100000 + Math.random() * 9000);
  return `DELETE-${randomNum}`;
}

export function DeleteAccountDialog({
  accountId,
  accountName,
  transactionCount,
  trigger,
  redirectToDashboard = false,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;
  const router = useRouter();

  // 2-Step verification state
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState(generateVerificationCode);
  const [userInput, setUserInput] = useState("");

  const inputId = useId();

  const {
    loading: isDeleting,
    fn: deleteAccountFn,
    data: deleteResult,
    error,
  } = useFetch(deleteAccount);

  // Reset dialog state on open/close
  useEffect(() => {
    if (open) {
      setStep(1);
      setUserInput("");
      setVerificationCode(generateVerificationCode());
    } else {
      setStep(1);
      setUserInput("");
    }
  }, [open]);

  const handleDelete = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (userInput.trim() !== verificationCode) {
      toast.error("Verification code does not match");
      return;
    }

    await deleteAccountFn(accountId);
  };

  useEffect(() => {
    if (deleteResult?.success) {
      toast.success("Account and its transactions deleted successfully");
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
      if (redirectToDashboard) {
        router.push("/dashboard");
      } else {
        router.refresh();
      }
    } else if (deleteResult && !deleteResult.success) {
      toast.error(deleteResult.error || "Failed to delete account");
    }
  }, [deleteResult, redirectToDashboard, router, setOpen, onSuccess]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to delete account");
    }
  }, [error]);

  const isCodeMatched = userInput.trim() === verificationCode;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : null}
      <DialogContent
        className="sm:max-w-[440px]"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 1 ? (
          /* Step 1: Initial Warning & Confirmation */
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 mb-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-xl">
                Delete Account?
              </DialogTitle>
              <DialogDescription className="text-center pt-1 text-sm">
                Are you sure you want to delete{" "}
                <strong className="text-foreground">{accountName}</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/40 p-3 rounded-md border border-red-200 dark:border-red-900/50 text-center">
              This will permanently delete this account and all{" "}
              {transactionCount !== undefined ? (
                <strong>
                  {transactionCount} associated transaction
                  {transactionCount === 1 ? "" : "s"}
                </strong>
              ) : (
                <strong>all associated transactions</strong>
              )}
              . This action cannot be undone.
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setStep(2);
                }}
                className="gap-2 mx-2"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Step 2: Verification by Typing Random Text */
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 mb-2">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-xl">
                Confirm Account Deletion
              </DialogTitle>
              <DialogDescription className="text-center pt-1 text-sm">
                To confirm permanent deletion of{" "}
                <strong className="text-foreground">{accountName}</strong>,
                please type the verification text below:
              </DialogDescription>
            </DialogHeader>

            {/* Random Verification Code Box */}
            <div className="select-all rounded-md bg-muted/80 p-3 text-center font-mono text-base font-bold tracking-wider text-red-600 dark:text-red-400 border border-border">
              {verificationCode}
            </div>

            <div className="space-y-2 py-2">
              <label
                htmlFor={inputId}
                className="text-xs font-medium text-muted-foreground"
              >
                Type &ldquo;{verificationCode}&rdquo; to confirm:
              </label>
              <Input
                id={inputId}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={verificationCode}
                className="font-sans text-center tracking-wider"
                autoFocus
                disabled={isDeleting}
              />
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setStep(1);
                  setUserInput("");
                }}
                disabled={isDeleting}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={!isCodeMatched || isDeleting}
                className="gap-2 mx-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
