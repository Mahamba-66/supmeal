export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietaire",
  EDITOR: "Editeur",
  READER: "Lecteur",
  COMMENTER: "Commentateur",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
