// Marka ayarları content.json'dan gelir.
import C from "./content.json";

const { en, ...tr } = C.brand;
export const brand = tr;
