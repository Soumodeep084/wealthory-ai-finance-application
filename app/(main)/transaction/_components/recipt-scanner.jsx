"use client";

import { useRef, useEffect } from "react";
import { Camera, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";

export function ReceiptScanner({ onScanComplete }) {
    const fileInputRef = useRef(null);

    const isScanReceiptAvailable =
        process.env.NEXT_PUBLIC_SCAN_RECEIPT_AVAILABLE === "true";

    const {
        loading: scanReceiptLoading,
        fn: scanReceiptFn,
        data: scannedData,
    } = useFetch(scanReceipt);

    const handleReceiptScan = async (file) => {
        // Extra safety check
        if (!isScanReceiptAvailable) {
            toast.info("AI Receipt Scanner is currently unavailable.");
            return;
        }

        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }

        await scanReceiptFn(file);
    };

    useEffect(() => {
        if (scannedData && !scanReceiptLoading) {
            onScanComplete(scannedData);
            toast.success("Receipt scanned successfully");
        }
    }, [scannedData, scanReceiptLoading, onScanComplete]);

    const handleButtonClick = () => {
        if (!isScanReceiptAvailable) {
            toast.info(
                "AI Receipt Scanner is temporarily unavailable. Please try again later."
            );
            return;
        }

        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <div
                className={`relative flex items-center gap-4 ${!isScanReceiptAvailable ? "cursor-not-allowed" : ""
                    }`}
                title={
                    !isScanReceiptAvailable
                        ? "AI Receipt Scanner is currently unavailable due to maintenance. Please try again later."
                        : "Scan your receipt using AI"
                }
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    disabled={!isScanReceiptAvailable || scanReceiptLoading}
                    onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (file) {
                            handleReceiptScan(file);
                        }

                        // Allow selecting the same file again
                        e.target.value = "";
                    }}
                />

                <Button
                    type="button"
                    variant="outline"
                    className={`w-full h-10 text-black transition-all ${isScanReceiptAvailable
                            ? "bg-gradient-to-br from-orange-600 via-white to-green-800 animate-gradient hover:opacity-90 hover:text-gray-600"
                            : "bg-gray-200 text-gray-500 opacity-70 cursor-not-allowed hover:bg-gray-200 hover:text-gray-500"
                        }`}
                    onClick={handleButtonClick}
                    disabled={scanReceiptLoading || !isScanReceiptAvailable}
                >
                    {scanReceiptLoading ? (
                        <>
                            <Loader2 className="mr-2 animate-spin" />
                            <span>Scanning Receipt...</span>
                        </>
                    ) : !isScanReceiptAvailable ? (
                        <>
                            <LockKeyhole className="mr-2 h-4 w-4" />
                            <span>AI Receipt Scanner Unavailable</span>
                        </>
                    ) : (
                        <>
                            <Camera className="mr-2" />
                            <span>Scan Receipt with AI</span>
                        </>
                    )}
                </Button>
            </div>

            {!isScanReceiptAvailable && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                    AI Receipt Scanner is temporarily unavailable due to
                    maintenance. Please try again later.
                </p>
            )}
        </div>
    );
}