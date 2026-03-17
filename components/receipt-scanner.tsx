"use client";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Camera, Upload, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface ScanResult {
  amount: number;
  description: string;
  category: string;
  date: string;
}

interface ReceiptScannerProps {
  onScanComplete: (result: ScanResult) => void;
}

export function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock receipt scanning - in production, this would use OCR API
  const processReceipt = async (file: File): Promise<ScanResult> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock extraction - in reality, you'd use:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js (client-side)
    const mockResults: ScanResult[] = [
      {
        amount: 45.67,
        description: "Grocery Shopping",
        category: "Food & Dining",
        date: new Date().toISOString().split("T")[0],
      },
      {
        amount: 89.99,
        description: "Restaurant Dinner",
        category: "Food & Dining",
        date: new Date().toISOString().split("T")[0],
      },
      {
        amount: 25.0,
        description: "Gas Station",
        category: "Transportation",
        date: new Date().toISOString().split("T")[0],
      },
      {
        amount: 120.5,
        description: "Electric Bill",
        category: "Bills & Utilities",
        date: new Date().toISOString().split("T")[0],
      },
    ];

    return mockResults[Math.floor(Math.random() * mockResults.length)];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process receipt
    setIsScanning(true);
    try {
      const result = await processReceipt(file);
      toast.success("Receipt scanned successfully!");
      onScanComplete(result);
      setIsOpen(false);
      setPreviewUrl(null);
    } catch (error) {
      toast.error("Failed to scan receipt. Please try again.");
      console.error("Receipt scanning error:", error);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        <Camera className="h-4 w-4 mr-2" />
        Scan Receipt
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Receipt</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!previewUrl && !isScanning && (
              <>
                <p className="text-sm text-muted-foreground">
                  Upload or capture a photo of your receipt to automatically
                  extract expense details.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={triggerFileInput}
                    variant="outline"
                    className="h-auto py-6"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="h-8 w-8" />
                      <div>
                        <div className="font-medium">Take Photo</div>
                        <div className="text-xs text-muted-foreground">
                          Use your camera
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={triggerFileInput}
                    variant="outline"
                    className="h-auto py-6"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8" />
                      <div>
                        <div className="font-medium">Upload Image</div>
                        <div className="text-xs text-muted-foreground">
                          Choose from gallery
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-xs">
                  <p className="font-medium mb-1">💡 Tips for best results:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Ensure receipt is well-lit and in focus</li>
                    <li>• Capture the entire receipt in frame</li>
                    <li>• Avoid shadows and glare</li>
                  </ul>
                </div>
              </>
            )}

            {previewUrl && !isScanning && (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full rounded-lg border"
                />
                <p className="text-sm text-muted-foreground text-center">
                  Processing receipt...
                </p>
              </div>
            )}

            {isScanning && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="w-32 h-32 object-cover rounded-lg border opacity-50"
                  />
                )}
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium">Scanning receipt...</p>
                  <p className="text-sm text-muted-foreground">
                    Extracting expense details
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
