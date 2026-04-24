import { useEffect, useMemo, useState } from "react";
import { X, Coins, Loader2, CheckCircle2, XCircle, Smartphone, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GIFTS,
  Gift,
  COIN_TO_UGX,
  detectProvider,
  initiateMomo,
  confirmMomo,
  recordTip,
  Provider,
} from "@/lib/tips";
import { toast } from "@/hooks/use-toast";

interface TipModalProps {
  open: boolean;
  onClose: () => void;
  artistName: string;
  /** Sender display name — defaults to "Anonymous" if not provided */
  fromName?: string;
}

type Step = "gifts" | "phone" | "initiating" | "confirming" | "result";

const TipModal = ({ open, onClose, artistName, fromName = "Anonymous" }: TipModalProps) => {
  const [step, setStep] = useState<Step>("gifts");
  const [gift, setGift] = useState<Gift | null>(null);
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [txId, setTxId] = useState<string | null>(null);
  const [resultOk, setResultOk] = useState(false);

  // reset when re-opening
  useEffect(() => {
    if (open) {
      setStep("gifts");
      setGift(null);
      setPhone("");
      setProvider(null);
      setStatusMessage("");
      setTxId(null);
    }
  }, [open]);

  const detected = useMemo(() => detectProvider(phone), [phone]);
  const amountUGX = (gift?.coins ?? 0) * COIN_TO_UGX;

  const handlePickGift = (g: Gift) => {
    setGift(g);
    setStep("phone");
  };

  const handlePay = async () => {
    if (!gift) return;
    const finalProvider = detected ?? provider;
    if (!finalProvider) {
      toast({ title: "Pick a provider", description: "Couldn't detect MTN or Airtel — choose one." });
      return;
    }
    setProvider(finalProvider);
    setStep("initiating");
    try {
      const init = await initiateMomo({ provider: finalProvider, phone, amountUGX });
      setTxId(init.transactionId);
      setStatusMessage(init.message);
      setStep("confirming");
      const result = await confirmMomo(init.transactionId);
      setResultOk(result.status === "success");
      setStatusMessage(result.message + ` (Ref: ${result.reference})`);
      if (result.status === "success") {
        recordTip({
          artistName,
          giftId: gift.id,
          giftName: gift.name,
          giftEmoji: gift.emoji,
          coins: gift.coins,
          amountUGX,
          fromName,
          fromPhone: phone,
          provider: finalProvider,
          status: "success",
        });
      }
      setStep("result");
    } catch {
      setResultOk(false);
      setStatusMessage("Network error — please try again.");
      setStep("result");
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            {step !== "gifts" && step !== "result" ? (
              <button
                onClick={() => setStep("gifts")}
                className="p-1 text-muted-foreground hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <span className="w-6" />
            )}
            <p className="text-sm font-semibold text-foreground">
              {step === "gifts" && `Send a gift to ${artistName}`}
              {step === "phone" && "Pay with Mobile Money"}
              {step === "initiating" && "Initiating payment…"}
              {step === "confirming" && "Awaiting confirmation…"}
              {step === "result" && (resultOk ? "Gift sent!" : "Payment failed")}
            </p>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {step === "gifts" && (
              <>
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Coins size={12} /> 1 coin = UGX {COIN_TO_UGX}
                </p>
                <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
                  {GIFTS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handlePickGift(g)}
                      className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-95 transition-all"
                    >
                      <span className="text-3xl leading-none" aria-hidden>
                        {g.emoji}
                      </span>
                      <span className="text-[11px] font-medium text-foreground truncate max-w-full">
                        {g.name}
                      </span>
                      <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                        <Coins size={9} /> {g.coins}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "phone" && gift && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                  <span className="text-3xl">{gift.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{gift.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {gift.coins} coins · UGX {amountUGX.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Mobile Money number
                  </label>
                  <div className="relative mt-1.5">
                    <Smartphone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="e.g. 0772 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  {phone.length > 2 && (
                    <p className="text-[11px] mt-1.5 text-muted-foreground">
                      {detected
                        ? `Detected: ${detected === "mtn" ? "MTN MoMo" : "Airtel Money"}`
                        : "Couldn't detect provider — pick one below."}
                    </p>
                  )}
                </div>

                {!detected && phone.length > 2 && (
                  <div className="grid grid-cols-2 gap-2">
                    {(["mtn", "airtel"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setProvider(p)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                          provider === p
                            ? "border-primary text-primary bg-primary/10"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {p === "mtn" ? "MTN MoMo" : "Airtel Money"}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={phone.replace(/\D/g, "").length < 9 || (!detected && !provider)}
                  className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity"
                >
                  Pay UGX {amountUGX.toLocaleString()}
                </button>
              </div>
            )}

            {(step === "initiating" || step === "confirming") && (
              <div className="py-10 flex flex-col items-center gap-4 text-center">
                <Loader2 size={36} className="text-primary animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {step === "initiating"
                      ? `Contacting ${provider === "mtn" ? "MTN" : "Airtel"} Mobile Money…`
                      : "Waiting for you to approve on your phone…"}
                  </p>
                  {statusMessage && (
                    <p className="text-xs text-muted-foreground mt-2 max-w-xs">{statusMessage}</p>
                  )}
                  {txId && (
                    <p className="text-[10px] text-muted-foreground mt-2 font-mono">{txId}</p>
                  )}
                </div>
              </div>
            )}

            {step === "result" && (
              <div className="py-8 flex flex-col items-center gap-4 text-center">
                {resultOk ? (
                  <CheckCircle2 size={48} className="text-primary" />
                ) : (
                  <XCircle size={48} className="text-destructive" />
                )}
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {resultOk
                      ? `${gift?.emoji} ${gift?.name} sent to ${artistName}`
                      : "Payment didn't go through"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">{statusMessage}</p>
                </div>
                <div className="flex gap-2 w-full">
                  {!resultOk && (
                    <button
                      onClick={() => setStep("phone")}
                      className="flex-1 py-2.5 rounded-full border border-border text-foreground text-sm font-semibold"
                    >
                      Try again
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TipModal;
