// Shared icon registry for the homepage editor's "Icon" component — imported by
// both the admin editor (client) and the published homepage renderer (server),
// so the exact same icon set and ids are available in both places.
import type { ComponentType, SVGProps } from "react";
import {
  ShoppingCart, ShoppingBag, Check, Tag, Gift, Package, Truck, Star, Heart,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Menu, ChevronLeft, ChevronRight, Home, Search, MapPin,
  CreditCard, Wallet, Banknote, DollarSign, Landmark, ShieldCheck,
  Settings, SlidersHorizontal, User, Bell, Mail, Phone, Lock, Info,
} from "lucide-react";
import {
  FaFacebook, FaInstagram, FaXTwitter, FaWhatsapp, FaYoutube,
  FaLinkedin, FaPinterest, FaTiktok, FaTelegram, FaSnapchat,
  FaCar, FaCarSide, FaVanShuttle, FaMotorcycle, FaTaxi,
} from "react-icons/fa6";

export type HomeIconCategory = "Social" | "Shopping" | "Navigation" | "Payment" | "Settings" | "Vehicles";

export interface HomeIconDef {
  id: string;
  label: string;
  category: HomeIconCategory;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const HOME_ICON_CATEGORIES: HomeIconCategory[] = ["Social", "Shopping", "Navigation", "Payment", "Settings", "Vehicles"];

export const HOME_ICONS: HomeIconDef[] = [
  // Social
  { id: "facebook", label: "Facebook", category: "Social", Icon: FaFacebook },
  { id: "instagram", label: "Instagram", category: "Social", Icon: FaInstagram },
  { id: "twitter", label: "X / Twitter", category: "Social", Icon: FaXTwitter },
  { id: "whatsapp", label: "WhatsApp", category: "Social", Icon: FaWhatsapp },
  { id: "youtube", label: "YouTube", category: "Social", Icon: FaYoutube },
  { id: "linkedin", label: "LinkedIn", category: "Social", Icon: FaLinkedin },
  { id: "pinterest", label: "Pinterest", category: "Social", Icon: FaPinterest },
  { id: "tiktok", label: "TikTok", category: "Social", Icon: FaTiktok },
  { id: "telegram", label: "Telegram", category: "Social", Icon: FaTelegram },
  { id: "snapchat", label: "Snapchat", category: "Social", Icon: FaSnapchat },
  // Shopping
  { id: "cart", label: "Cart", category: "Shopping", Icon: ShoppingCart },
  { id: "bag", label: "Bag", category: "Shopping", Icon: ShoppingBag },
  { id: "check", label: "Check", category: "Shopping", Icon: Check },
  { id: "tag", label: "Tag", category: "Shopping", Icon: Tag },
  { id: "gift", label: "Gift", category: "Shopping", Icon: Gift },
  { id: "package", label: "Package", category: "Shopping", Icon: Package },
  { id: "truck", label: "Delivery", category: "Shopping", Icon: Truck },
  { id: "star", label: "Star", category: "Shopping", Icon: Star },
  { id: "heart", label: "Wishlist", category: "Shopping", Icon: Heart },
  // Navigation
  { id: "arrow-left", label: "Arrow Left", category: "Navigation", Icon: ArrowLeft },
  { id: "arrow-right", label: "Arrow Right", category: "Navigation", Icon: ArrowRight },
  { id: "arrow-up", label: "Arrow Up", category: "Navigation", Icon: ArrowUp },
  { id: "arrow-down", label: "Arrow Down", category: "Navigation", Icon: ArrowDown },
  { id: "chevron-left", label: "Chevron Left", category: "Navigation", Icon: ChevronLeft },
  { id: "chevron-right", label: "Chevron Right", category: "Navigation", Icon: ChevronRight },
  { id: "menu", label: "Menu", category: "Navigation", Icon: Menu },
  { id: "home", label: "Home", category: "Navigation", Icon: Home },
  { id: "search", label: "Search", category: "Navigation", Icon: Search },
  { id: "map-pin", label: "Location", category: "Navigation", Icon: MapPin },
  // Payment
  { id: "credit-card", label: "Credit Card", category: "Payment", Icon: CreditCard },
  { id: "wallet", label: "Wallet", category: "Payment", Icon: Wallet },
  { id: "banknote", label: "Cash", category: "Payment", Icon: Banknote },
  { id: "dollar", label: "Price", category: "Payment", Icon: DollarSign },
  { id: "bank", label: "Bank", category: "Payment", Icon: Landmark },
  { id: "shield-check", label: "Secure", category: "Payment", Icon: ShieldCheck },
  // Settings & common
  { id: "settings", label: "Settings", category: "Settings", Icon: Settings },
  { id: "sliders", label: "Filters", category: "Settings", Icon: SlidersHorizontal },
  { id: "user", label: "Account", category: "Settings", Icon: User },
  { id: "bell", label: "Notifications", category: "Settings", Icon: Bell },
  { id: "mail", label: "Email", category: "Settings", Icon: Mail },
  { id: "phone", label: "Phone", category: "Settings", Icon: Phone },
  { id: "lock", label: "Privacy", category: "Settings", Icon: Lock },
  { id: "info", label: "Info", category: "Settings", Icon: Info },
  // Vehicles (ride-hailing/taxi components)
  { id: "car", label: "Economy", category: "Vehicles", Icon: FaCar },
  { id: "car-side", label: "Premium", category: "Vehicles", Icon: FaCarSide },
  { id: "van-shuttle", label: "SUV", category: "Vehicles", Icon: FaVanShuttle },
  { id: "motorcycle", label: "Bike", category: "Vehicles", Icon: FaMotorcycle },
  { id: "taxi", label: "Taxi", category: "Vehicles", Icon: FaTaxi },
];

const HOME_ICON_MAP: Record<string, HomeIconDef> = Object.fromEntries(HOME_ICONS.map((i) => [i.id, i]));

export function getHomeIcon(id?: string): HomeIconDef | undefined {
  return id ? HOME_ICON_MAP[id] : undefined;
}
