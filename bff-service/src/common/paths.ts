export enum CartPaths {
  GET_CART = 'profile/cart',
  PUT_CART = 'profile/cart',
  CHECKOUT = 'profile/cart/checkout',
}

export enum ProductPaths {
  GET_PRODUCTS = 'products',
  GET_SINGLE_PRODUCT = 'products/:id',
  POST_PRODUCT = 'products',
}

const healthCheckPaths = ['', 'ping'];

export const bffPaths = (
  [
    ...Object.values(CartPaths),
    ...Object.values(ProductPaths),
    ...healthCheckPaths,
  ] as const
).map((url) => `/bff/${url}`);
