
export interface FoodNutrientFacts {
    serving_size: number;
    serving_per_container: number;
    calories: number;
    total_fat: number;
    saturated_fat: number;
    trans_fat: number;
    cholesterol: number;
    sodium: number;
    total_carbohydrate: number;
    dietary_fiber: number;
    total_sugar: number;
    added_sugar: number;
    protein: number;
    calcium: number;
    iron: number;
    potassium: number;
    vitamin_a: number;
    vitamin_b: number;
    vitamin_b6: number;
    vitamin_c: number;
    vitamin_d: number;
    vitamin_b12: number;
    niacin: number;
    riboflavin: number;
    pantothenic_acid: number;
    energy: number;
  }

  export interface Product {
    _id: string;
    image_url: string;
    name: string;
    barcode_id: string;
    food_category: string;
    ingredients: Array<string>;
    data_type: string;
    published_date: string;
    brand_owner: string;
    brand_name: string;
    market_country: string;
    modified_date: string;
    data_source: string;
    package_weight: string;
    serving_size_unit: string;
    serving_size: number;
    household_serving_full_text: string;
    trade_channels: string[];
    all_highlight_fields: string;
    score: number;
    microbes: any[];
    food_nutrient_facts: FoodNutrientFacts;
    final_food_input_foods: any[];
    food_measures: any[];
    food_attributes: any[];
    food_attribute_types: any[];
    food_version_ids: any[];
  }
  