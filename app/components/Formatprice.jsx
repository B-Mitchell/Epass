const Formatprice = (price) => {
  if (price === null || price === undefined) return '0';
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default Formatprice;