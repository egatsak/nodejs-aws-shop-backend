import Joi from "joi";

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

export const productDtoSchema = Joi.object<ProductDto>({
  title: Joi.string().required(),
  price: Joi.number().required().integer().min(0),
  description: Joi.string(),
  count: Joi.number().required().integer().min(0),
});
