export const formatCurrency = (n: number, currency = "BOB") =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency }).format(n);
