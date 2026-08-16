import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { roleLabel } from "../lib/roles";
import type { PendingInvite } from "../lib/types";

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
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link to="/" className="text-sm text-purple-600">{"<- Retour au tableau de bord"}</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Invitations en attente</h1>

      <ul className="flex flex-col gap-3">
        {invites.map((inv) => (
          <li key={inv.id} className="border rounded px-4 py-3 flex justify-between items-center">
            <span>
              <span className="font-semibold">{inv.cookbook.name}</span>
             <span className="ml-2 text-sm text-gray-500">(role propose: {roleLabel(inv.role)})</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(inv.cookbook.id)}
                className="bg-purple-600 text-white rounded px-3 py-1 text-sm"
              >
                Accepter
              </button>
              <button
                onClick={() => handleDecline(inv.cookbook.id)}
                className="border rounded px-3 py-1 text-sm text-red-600"
              >
                Refuser
              </button>
            </div>
          </li>
        ))}
        {invites.length === 0 && <p className="text-gray-500">Aucune invitation en attente.</p>}
      </ul>
    </div>
  );
}
