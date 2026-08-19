import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { roleLabel } from "../lib/roles";
import Layout from "../components/Layout";
import type { PendingInvite } from "../lib/types";
import { Mail, Check, X } from "lucide-react";

export default function Invites() {
  const [invites, setInvites] = useState<PendingInvite[]>([]);

  async function loadInvites() {
    const res = await api.get("/cookbooks/invites/pending");
    setInvites(res.data.invites);
  }

  useEffect(() => {
    loadInvites();
  }, []);

  async function handleAccept(cookbookId: string) {
    await api.post(`/cookbooks/${cookbookId}/accept`);
    loadInvites();
  }

  async function handleDecline(cookbookId: string) {
    await api.post(`/cookbooks/${cookbookId}/decline`);
    loadInvites();
  }

  return (
    <Layout>
      <p className="font-mono text-xs uppercase tracking-widest text-paprika mb-2">À traiter</p>
      <h1 className="font-display text-3xl font-bold mb-8">Invitations</h1>

      <ul className="flex flex-col gap-3">
        {invites.map((inv) => (
          <li key={inv.id} className="bg-paper border border-line rounded-2xl p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                <Mail size={18} className="text-paprika-dark" />
              </div>
              <div>
                <p className="font-display font-semibold">{inv.cookbook.name}</p>
                <p className="text-xs font-mono text-ink/50">Rôle proposé : {roleLabel(inv.role)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(inv.cookbook.id)}
                className="flex items-center gap-1.5 bg-indigo text-cream rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-indigo-light"
              >
                <Check size={14} /> Accepter
              </button>
              <button
                onClick={() => handleDecline(inv.cookbook.id)}
                className="flex items-center gap-1.5 border border-line rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <X size={14} /> Refuser
              </button>
            </div>
          </li>
        ))}
        {invites.length === 0 && <p className="text-ink/50 text-center py-12">Aucune invitation en attente.</p>}
      </ul>
    </Layout>
  );
}
