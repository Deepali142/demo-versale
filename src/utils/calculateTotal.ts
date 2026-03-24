export interface IOrderItem {
  quantity: string | number; // sometimes "+1" or numeric
  price: string | number; // can come as number or string
}

export function calculateTotal(items: IOrderItem[]): number {
  return items.reduce((total, item) => {
    const quantity = parseInt(item.quantity.toString().replace("+", ""), 10);
    const price = parseFloat(item.price.toString());
    return total + quantity * price;
  }, 0);
}
