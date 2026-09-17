import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import api from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

function errMsg(e: any, fallback: string): string {
  return e?.response?.data?.message || e?.message || fallback;
}

const AdminRedeemSettings = () => {
  const [redeemMin, setRedeemMin] = useState("40");
  const [redeemMax, setRedeemMax] = useState("300");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRedeemLimits = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/redeem-settings");
      if (data?.settings) {
        setRedeemMin(String(data.settings.min_amount));
        setRedeemMax(String(data.settings.max_amount));
      }
    } catch (e: any) {
      toast({ title: "Failed to load", description: errMsg(e, "Please try again."), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRedeemLimits(); }, []);

  const saveRedeemLimits = async () => {
    const minNum = parseFloat(redeemMin);
    const maxNum = parseFloat(redeemMax);

    if (isNaN(minNum) || minNum < 0) {
      toast({ title: "Invalid minimum", description: "Minimum must be 0 or greater", variant: "destructive" });
      return;
    }
    if (isNaN(maxNum) || maxNum <= 0) {
      toast({ title: "Invalid maximum", description: "Maximum must be greater than 0", variant: "destructive" });
      return;
    }
    if (minNum > maxNum) {
      toast({ title: "Invalid range", description: "Minimum cannot exceed maximum", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post("/admin/redeem-settings", { min_amount: minNum, max_amount: maxNum });
      setRedeemMin(String(data.settings.min_amount));
      setRedeemMax(String(data.settings.max_amount));
      toast({ title: "Redeem limits updated" });
    } catch (e: any) {
      toast({ title: "Failed to save", description: errMsg(e, "Please try again."), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Redeem Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure the minimum and maximum redeem amounts allowed for users.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold mb-1">Redeem Limits</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Daily limit counts all pending and completed redeem requests submitted today.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Minimum Redeem Per Request ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  value={redeemMin}
                  onChange={(e) => setRedeemMin(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/50 pl-7 pr-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Daily Redeem Limit Per User ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  value={redeemMax}
                  onChange={(e) => setRedeemMax(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/50 pl-7 pr-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={saveRedeemLimits} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRedeemSettings;
