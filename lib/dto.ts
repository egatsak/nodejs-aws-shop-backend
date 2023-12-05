import { ObjectSchema, number, object, string } from "joi";

export interface Product {
  id: string;
  title: string;
  price: number;
  description?: string;
}

export interface ProductForFrontend {
  id: string;
  title: string;
  price: number;
  description?: string;
  count: number;
}

export interface ProductDto {
  title: string;
  price: number;
  description?: string;
  count: number;
}

export const productDtoSchema: ObjectSchema<ProductDto> = object({
  title: string().required(),
  price: number().required().integer().min(0),
  description: string(),
  count: number().required().integer().min(0),
});
