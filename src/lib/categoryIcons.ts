const categoryIconMap: Record<string, string> = {
  "wallet-cards": "mdi-wallet-outline",
  gift: "mdi-gift-outline",
  "circle-plus": "mdi-plus-circle-outline",
  utensils: "mdi-silverware-fork-knife",
  bus: "mdi-bus",
  house: "mdi-home-outline",
  bolt: "mdi-lightning-bolt-outline",
  "shopping-bag": "mdi-shopping-outline",
  "heart-pulse": "mdi-heart-pulse",
  "book-open": "mdi-book-open-page-variant-outline",
  "gamepad-2": "mdi-gamepad-variant-outline",
  ellipsis: "mdi-dots-horizontal",
  circle: "mdi-circle-outline",
  car: "mdi-car-outline",
  home: "mdi-home-outline",
  briefcase: "mdi-briefcase-outline",
  heart: "mdi-heart-outline",
};

export const categoryIconItems = [
  { title: "เงินเดือน", value: "wallet-cards" },
  { title: "โบนัส", value: "gift" },
  { title: "รายรับอื่น", value: "circle-plus" },
  { title: "อาหาร", value: "utensils" },
  { title: "เดินทาง", value: "bus" },
  { title: "ที่อยู่อาศัย", value: "house" },
  { title: "ค่าน้ำไฟ/อินเทอร์เน็ต", value: "bolt" },
  { title: "ช้อปปิ้ง", value: "shopping-bag" },
  { title: "สุขภาพ", value: "heart-pulse" },
  { title: "การศึกษา", value: "book-open" },
  { title: "ความบันเทิง", value: "gamepad-2" },
  { title: "อื่น ๆ", value: "ellipsis" },
  { title: "ทั่วไป", value: "circle" },
  { title: "รถยนต์", value: "car" },
  { title: "บ้าน", value: "home" },
  { title: "งาน", value: "briefcase" },
  { title: "หัวใจ", value: "heart" },
];

export function categoryIcon(icon: string) {
  return categoryIconMap[icon] ?? "mdi-circle-outline";
}
