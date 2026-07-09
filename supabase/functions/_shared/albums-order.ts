export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function getAlbumOrderInfo(folderNames: string[]) {
  const usedOrders = folderNames
    .map((folderName) => {
      const match = folderName.match(/^(\d+)\./);
      return match ? Number(match[1]) : null;
    })
    .filter((order): order is number => order !== null && Number.isInteger(order) && order > 0)
    .sort((a, b) => a - b);

  return {
    count: folderNames.length,
    folders: folderNames,
    usedOrders,
    nextOrder: usedOrders.length > 0 ? Math.max(...usedOrders) + 1 : 1,
  };
}
