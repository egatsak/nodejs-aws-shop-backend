interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
}

export const products: Product[] = [
  {
    description: "Short Product Description1",
    id: "855e9a53-dd3c-46b8-8cb1-329f133146f6",
    price: 24,
    title: "ProductOne",
  },
  {
    description: "Short Product Description7",
    id: "d5c67566-72ff-4f1e-b4f0-ecc9b84b2b40",
    price: 15,
    title: "ProductTitle",
  },
  {
    description: "Short Product Description2",
    id: "a5116cf4-9915-4a91-8424-14dc3d5e6cb2",
    price: 23,
    title: "Product",
  },
  {
    description: "Short Product Description4",
    id: "c946787b-97ef-44a4-b7e5-adbae0175054",
    price: 15,
    title: "ProductTest",
  },
  {
    description: "Short Product Description1",
    id: "eac066c5-7f67-48cc-8180-5a3c97597339",
    price: 23,
    title: "Product2",
  },
  {
    description: "Short Product Description7",
    id: "7567ec4b-b10c-45c5-9345-fc73c48a80a1",
    price: 15,
    title: "ProductName",
  },
];
