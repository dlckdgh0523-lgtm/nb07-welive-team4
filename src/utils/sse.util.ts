export function formatSseMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
};

export function formatSseComment(comment: string): string {
  return `: ${comment}\n\n`;
};

