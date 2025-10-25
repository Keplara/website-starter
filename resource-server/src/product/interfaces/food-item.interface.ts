import { Ingredient } from "./ingredient.interface";
import { Nutrient } from "./nutrient.interface";

export interface FoodItem {
    fdcid: number;
    description: string;
    isBranded: boolean;
    brandOwner: string;
    brandName: string;
    ingredients: Ingredient;
    foodCategory: string;
    modifiedDate: Date;
    packageWeight: string;
    servingSizeUnit: string;
    householdServingFullText: string;
    nutrients: Nutrient;
    barCode: string;
}
