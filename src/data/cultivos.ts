import type { ActividadCultivo, Cultivo, Receta } from "@/types/cultivos";

export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** Mes actual para "en temporada" (fijo para una demo estable). Marzo = vendimia. */
export const MES_ACTUAL = 2;

export const CULTIVOS: Cultivo[] = [
  {
    id: "uva-malbec", nombre: "Uva Malbec", familia: "Vitis vinifera", seed: 0, photo: "racimos de uva Malbec al amanecer",
    color: "linear-gradient(135deg,#6F2548,#2D1018)",
    descripcion: "Variedad insignia de Mendoza. Sus racimos compactos y de hollejo grueso encuentran en el clima continental y la altura de los oasis mendocinos las condiciones ideales. Cosechada a mano durante la vendimia, entre febrero y abril, da origen a vinos de cuerpo intenso con notas a ciruela, mora y violeta.",
    calendario: ["r", "g", "h", "h", "r", "r", "r", "r", "r", "r", "g", "g"],
    nutricion: { porcion: "100 g", items: [
      { label: "Energía", value: "69 kcal" }, { label: "Carbohidratos", value: "18 g" }, { label: "Azúcares", value: "16 g" }, { label: "Fibra", value: "0,9 g" },
      { label: "Proteínas", value: "0,7 g" }, { label: "Potasio", value: "191 mg" }, { label: "Vitamina C", value: "10 % VD" }, { label: "Resveratrol", value: "Alto" },
    ] },
    beneficios: ["Antioxidante natural por su contenido de polifenoles", "Aporta hidratación y energía rápida", "Favorece la salud cardiovascular"],
    recetas: ["tarta-de-uva", "salsa-malbec", "mosto-casero"], actividades: ["cosecha-malbec-amanecer", "vendimia-familiar"],
  },
  {
    id: "aceituna-arauco", nombre: "Aceituna Arauco", familia: "Olea europaea", seed: 2, photo: "rama de olivo con aceitunas maduras",
    color: "linear-gradient(135deg,#8C9A4A,#3D4A1E)",
    descripcion: "Variedad criolla, la más cultivada en Mendoza. De pulpa firme y aceite generoso, se cosecha a mano entre marzo y mayo. Versátil: ideal tanto para mesa (en salmuera) como para la elaboración de aceite de oliva extra virgen, símbolo del paisaje rural del este mendocino.",
    calendario: ["r", "r", "h", "h", "h", "r", "r", "r", "r", "g", "g", "g"],
    nutricion: { porcion: "100 g", items: [
      { label: "Energía", value: "145 kcal" }, { label: "Grasas totales", value: "15 g" }, { label: "Grasas mono.", value: "11 g" }, { label: "Carbohidratos", value: "4 g" },
      { label: "Fibra", value: "3,3 g" }, { label: "Sodio", value: "735 mg" }, { label: "Vitamina E", value: "12 % VD" }, { label: "Hierro", value: "18 % VD" },
    ] },
    beneficios: ["Grasas saludables que protegen el corazón", "Rica en vitamina E y antioxidantes", "Buena fuente de fibra y minerales"],
    recetas: ["tapenade", "aceitunas-en-salmuera"], actividades: ["recorrido-olivos"],
  },
  {
    id: "durazno", nombre: "Durazno", familia: "Prunus persica", seed: 4, photo: "duraznos maduros en el árbol",
    color: "linear-gradient(135deg,#D99A4E,#A6794F)",
    descripcion: "El durazno mendocino aprovecha el contraste de días cálidos y noches frescas para concentrar azúcares y aromas. Se cosecha entre diciembre y febrero según la variedad. Su piel aterciopelada y su pulpa jugosa lo convierten en una de las frutas más esperadas del verano.",
    calendario: ["h", "h", "r", "r", "r", "r", "r", "r", "r", "g", "g", "g"],
    nutricion: { porcion: "100 g", items: [
      { label: "Energía", value: "39 kcal" }, { label: "Carbohidratos", value: "10 g" }, { label: "Azúcares", value: "8 g" }, { label: "Fibra", value: "1,5 g" },
      { label: "Proteínas", value: "0,9 g" }, { label: "Potasio", value: "190 mg" }, { label: "Vitamina C", value: "11 % VD" }, { label: "Vitamina A", value: "10 % VD" },
    ] },
    beneficios: ["Rico en agua: ideal para hidratarse en verano", "Aporta antioxidantes (carotenos)", "Bajo en calorías, alto en sabor"],
    recetas: ["mermelada-durazno", "duraznos-almibar"], actividades: ["cosecha-duraznos"],
  },
  {
    id: "ciruela", nombre: "Ciruela D'Agen", familia: "Prunus domestica", seed: 5, photo: "ciruelas violetas en cosecha",
    color: "linear-gradient(135deg,#5C2A4E,#2A0F25)",
    descripcion: "Variedad europea adaptada a Mendoza, destinada principalmente a la deshidratación para producir ciruela seca. Se cosecha entre enero y marzo cuando la fruta cae naturalmente del árbol, ya con su máxima concentración de azúcares.",
    calendario: ["h", "h", "h", "r", "r", "r", "r", "r", "r", "r", "g", "g"],
    nutricion: { porcion: "100 g", items: [
      { label: "Energía", value: "46 kcal" }, { label: "Carbohidratos", value: "11 g" }, { label: "Azúcares", value: "10 g" }, { label: "Fibra", value: "1,4 g" },
      { label: "Potasio", value: "157 mg" }, { label: "Vitamina C", value: "10 % VD" }, { label: "Vitamina K", value: "8 % VD" }, { label: "Antioxidantes", value: "Alto" },
    ] },
    beneficios: ["Favorece el tránsito intestinal", "Aporta antioxidantes (antocianinas)", "Fuente natural de energía"],
    recetas: ["mermelada-ciruela"], actividades: [],
  },
  {
    id: "nuez", nombre: "Nuez Chandler", familia: "Juglans regia", seed: 2, photo: "nueces sobre madera de nogal",
    color: "linear-gradient(135deg,#A6794F,#5C3B22)",
    descripcion: "Producida en los valles altos de Mendoza, esta variedad de cáscara clara y pulpa abundante se cosecha entre marzo y mayo, cuando los frutos caen al suelo y se recolectan a mano. El secado al sol es parte fundamental del proceso artesanal.",
    calendario: ["r", "r", "h", "h", "h", "r", "r", "r", "r", "g", "g", "g"],
    nutricion: { porcion: "100 g", items: [
      { label: "Energía", value: "654 kcal" }, { label: "Grasas totales", value: "65 g" }, { label: "Omega 3 (ALA)", value: "9 g" }, { label: "Proteínas", value: "15 g" },
      { label: "Fibra", value: "6,7 g" }, { label: "Magnesio", value: "40 % VD" }, { label: "Manganeso", value: "163 % VD" }, { label: "Antioxidantes", value: "Muy alto" },
    ] },
    beneficios: ["Excelente fuente de omega 3 vegetal", "Protege la salud cerebral y cardiovascular", "Aporta saciedad y energía duradera"],
    recetas: ["pan-de-nuez"], actividades: [],
  },
  {
    id: "ajo-morado", nombre: "Ajo morado", familia: "Allium sativum", seed: 1, photo: "trenza de ajos morados secándose",
    color: "linear-gradient(135deg,#7A5A8C,#3A2540)",
    descripcion: "Mendoza es la principal productora de ajo de la Argentina. La variedad morada destaca por su sabor intenso y su excelente conservación. Se cosecha entre noviembre y diciembre, cuando la mata se acuesta y la cabeza alcanza su tamaño definitivo.",
    calendario: ["r", "r", "r", "g", "g", "g", "g", "g", "g", "g", "h", "h"],
    nutricion: { porcion: "100 g", items: [
      { label: "Energía", value: "149 kcal" }, { label: "Carbohidratos", value: "33 g" }, { label: "Proteínas", value: "6,4 g" }, { label: "Fibra", value: "2,1 g" },
      { label: "Vitamina C", value: "52 % VD" }, { label: "Vitamina B6", value: "95 % VD" }, { label: "Manganeso", value: "73 % VD" }, { label: "Alicina", value: "Alta" },
    ] },
    beneficios: ["Propiedades antibacterianas y antivirales", "Ayuda a regular la presión arterial", "Refuerza el sistema inmune"],
    recetas: ["aceite-ajo"], actividades: [],
  },
];

export const RECETAS: Receta[] = [
  { id: "tarta-de-uva", nombre: "Tarta rústica de uva Malbec", tiempo: "1 h 15 min", porciones: 6, dificultad: "Fácil", seed: 0, photo: "tarta rústica con uvas Malbec", cultivos: ["uva-malbec"],
    descripcion: "Una tarta abierta de masa quebrada con uvas Malbec frescas, miel y un toque de romero. Receta familiar mendocina que aprovecha la uva recién cosechada.",
    ingredientes: ["250 g de harina 0000", "120 g de manteca fría", "1 huevo", "2 cdas de azúcar mascabo", "1 pizca de sal", "400 g de uva Malbec", "2 cdas de miel de la finca", "1 ramita de romero fresco"],
    pasos: ["Mezclar harina, manteca en cubos, azúcar y sal hasta lograr un arenado.", "Agregar el huevo y unir sin amasar demás. Refrigerar 30 minutos.", "Estirar la masa de 4 mm y colocar en molde enmantecado. Pinchar el fondo.", "Lavar las uvas, cortar a la mitad y retirar las semillas.", "Disponer las uvas sobre la masa, rociar con miel y romero picado.", "Hornear 35 minutos a 180 °C hasta que la masa esté dorada.", "Dejar entibiar antes de desmoldar. Servir con crema fresca."] },
  { id: "salsa-malbec", nombre: "Salsa de reducción al Malbec", tiempo: "40 min", porciones: 4, dificultad: "Media", seed: 3, photo: "salsa de vino tinto reduciendo en sartén", cultivos: ["uva-malbec"],
    descripcion: "Reducción clásica para acompañar carnes rojas o quesos estacionados, hecha con vino Malbec joven y un toque de echalote.",
    ingredientes: ["500 ml de vino Malbec joven", "2 echalotes finamente picados", "1 cda de azúcar mascabo", "1 ramita de tomillo", "50 g de manteca fría", "Sal y pimienta a gusto"],
    pasos: ["En una sartén, dorar los echalotes con una cucharada de manteca.", "Agregar el vino, el azúcar y el tomillo. Reducir a fuego medio.", "Cocinar 25 minutos hasta que se reduzca a un tercio del volumen.", "Retirar el tomillo y montar con manteca fría, batiendo enérgicamente.", "Salpimentar y servir tibia sobre la carne."] },
  { id: "mosto-casero", nombre: "Mosto de uva sin alcohol", tiempo: "45 min + reposo", porciones: 8, dificultad: "Fácil", seed: 0, photo: "jugo de uva recién prensado en jarra", cultivos: ["uva-malbec"],
    descripcion: "Jugo concentrado de uva recién prensada, sin alcohol, ideal para acompañar el desayuno o como base de postres.",
    ingredientes: ["2 kg de uva Malbec madura", "2 cdas de azúcar (opcional)", "Jugo de medio limón"],
    pasos: ["Lavar las uvas y retirar de los escobajos.", "Triturar suavemente con un machacador de madera.", "Colocar en olla a fuego bajo durante 20 minutos.", "Colar a través de una tela limpia, presionando para extraer todo el jugo.", "Volver al fuego con el azúcar y el limón. Reducir 10 minutos.", "Embotellar en frascos esterilizados y conservar en heladera."] },
  { id: "tapenade", nombre: "Tapenade de aceitunas", tiempo: "15 min", porciones: 6, dificultad: "Fácil", seed: 2, photo: "tapenade en bowl con pan tostado", cultivos: ["aceituna-arauco", "ajo-morado"],
    descripcion: "Pasta untable provenzal con aceitunas Arauco, alcaparras y aceite de oliva mendocino. Perfecta para tostadas y picadas.",
    ingredientes: ["300 g de aceitunas Arauco descarozadas", "2 dientes de ajo morado", "2 cdas de alcaparras", "4 filetes de anchoa (opcional)", "100 ml de aceite de oliva extra virgen", "Jugo de medio limón", "Pimienta negra recién molida"],
    pasos: ["Colocar aceitunas, ajo, alcaparras y anchoas en una procesadora.", "Procesar a pulsos hasta obtener una pasta gruesa.", "Añadir el aceite de oliva en hilo, sin dejar de procesar.", "Terminar con jugo de limón y pimienta.", "Servir sobre pan tostado o como acompañamiento de quesos."] },
  { id: "aceitunas-en-salmuera", nombre: "Aceitunas en salmuera", tiempo: "20 min + 60 días", porciones: 12, dificultad: "Media", seed: 1, photo: "frascos de aceitunas en salmuera", cultivos: ["aceituna-arauco"],
    descripcion: "Método tradicional para curar las aceitunas Arauco recién cosechadas y conservarlas durante todo el año.",
    ingredientes: ["2 kg de aceitunas Arauco verdes", "100 g de sal gruesa por litro de agua", "Hojas de laurel", "Granos de pimienta", "Ramas de tomillo", "Cáscara de naranja"],
    pasos: ["Lavar las aceitunas y descartar las dañadas.", "Hacer un pequeño corte en cada una para que ingrese la salmuera.", "Colocar en agua fresca durante 10 días, cambiando el agua cada día.", "Preparar salmuera con 100 g de sal por litro de agua hervida y fría.", "Envasar en frascos con hierbas y cubrir con la salmuera.", "Tapar y dejar reposar 60 días en lugar fresco antes de consumir."] },
  { id: "mermelada-durazno", nombre: "Mermelada de durazno", tiempo: "1 h 30 min", porciones: 10, dificultad: "Fácil", seed: 4, photo: "mermelada de durazno casera en frasco", cultivos: ["durazno"],
    descripcion: "Receta clásica para conservar los duraznos de verano. Sin pectina agregada, con la justa textura.",
    ingredientes: ["1,5 kg de duraznos maduros", "900 g de azúcar", "Jugo de 1 limón", "1 vaina de vainilla (opcional)"],
    pasos: ["Pelar los duraznos, retirar el carozo y cortar en cubos.", "Mezclar con azúcar y jugo de limón en una olla amplia.", "Dejar macerar 1 hora a temperatura ambiente.", "Llevar al fuego medio y cocinar 50 a 60 minutos, revolviendo.", "Probar punto: una gota sobre un plato frío debe gelificar.", "Envasar caliente en frascos esterilizados y dar vuelta para crear vacío."] },
  { id: "duraznos-almibar", nombre: "Duraznos en almíbar", tiempo: "1 h", porciones: 8, dificultad: "Media", seed: 4, photo: "duraznos en almíbar en frasco", cultivos: ["durazno"],
    descripcion: "Conserva tradicional que captura el sabor del durazno fresco para disfrutar todo el año.",
    ingredientes: ["2 kg de duraznos firmes", "1 kg de azúcar", "2 l de agua", "1 cda de jugo de limón", "1 vaina de canela"],
    pasos: ["Blanquear los duraznos en agua hirviendo 1 minuto y pelarlos.", "Cortar a la mitad y retirar el carozo.", "Preparar almíbar con agua, azúcar, limón y canela. Hervir 5 minutos.", "Colocar los duraznos en frascos esterilizados.", "Cubrir con almíbar caliente dejando 1 cm de aire.", "Esterilizar en olla con agua a baño María durante 25 minutos."] },
  { id: "mermelada-ciruela", nombre: "Mermelada de ciruela", tiempo: "1 h 15 min", porciones: 10, dificultad: "Fácil", seed: 5, photo: "mermelada de ciruela en frasco rústico", cultivos: ["ciruela"],
    descripcion: "Mermelada artesanal de ciruela D'Agen con un toque de cardamomo. Ideal para desayunos y meriendas.",
    ingredientes: ["1,5 kg de ciruelas D'Agen", "750 g de azúcar", "Jugo de 1 limón", "3 vainas de cardamomo (opcional)"],
    pasos: ["Lavar las ciruelas, partir a la mitad y retirar el carozo.", "Cocinar a fuego medio con azúcar y limón.", "Agregar el cardamomo y revolver cada tanto, 45 minutos.", "Probar punto y retirar el cardamomo.", "Envasar caliente en frascos esterilizados."] },
  { id: "pan-de-nuez", nombre: "Pan de campo con nuez", tiempo: "3 h", porciones: 8, dificultad: "Media", seed: 2, photo: "pan rústico con nueces", cultivos: ["nuez"],
    descripcion: "Pan rústico de masa madre con nueces tostadas. Compañero ideal de quesos y aceite de oliva.",
    ingredientes: ["500 g de harina de trigo", "100 g de masa madre activa", "350 ml de agua tibia", "10 g de sal", "150 g de nueces tostadas", "1 cda de miel"],
    pasos: ["Mezclar harina, agua y masa madre. Autólisis de 30 minutos.", "Incorporar la sal, la miel y las nueces troceadas.", "Realizar 4 pliegues cada 30 minutos durante 2 horas.", "Bollar y dejar reposar en banneton 1 hora más.", "Hornear en olla cerrada 25 minutos a 240 °C.", "Destapar y hornear 20 minutos más hasta dorar."] },
  { id: "aceite-ajo", nombre: "Aceite de oliva al ajo morado", tiempo: "10 min + 7 días", porciones: 12, dificultad: "Fácil", seed: 1, photo: "botella de aceite de oliva con ajos", cultivos: ["ajo-morado", "aceituna-arauco"],
    descripcion: "Saborizado clásico para usar en ensaladas, pastas y tostadas. Combina dos productos emblema de Mendoza.",
    ingredientes: ["500 ml de aceite de oliva extra virgen", "1 cabeza de ajo morado", "2 ramas de romero", "1 cdita de pimienta en grano"],
    pasos: ["Pelar los dientes de ajo y aplastarlos ligeramente.", "Colocar en una botella de vidrio esterilizada con romero y pimienta.", "Cubrir con el aceite de oliva.", "Tapar y dejar macerar 7 días en lugar fresco y oscuro.", "Colar y trasvasar a botella limpia. Conservar refrigerado."] },
];

export const ACTIVIDADES_CULTIVO: Record<string, ActividadCultivo> = {
  "cosecha-malbec-amanecer": { id: "cosecha-malbec-amanecer", titulo: "Cosecha de Malbec al amanecer", finca: "Finca La Escondida", loc: "Maipú", dur: "3 h 30 min", precio: "12.500", seed: 0, photo: "viñedo al amanecer" },
  "vendimia-familiar": { id: "vendimia-familiar", titulo: "Vendimia familiar participativa", finca: "Finca Santa Rosa", loc: "San Rafael", dur: "4 h", precio: "11.000", seed: 3, photo: "manos cosechando uva" },
  "recorrido-olivos": { id: "recorrido-olivos", titulo: "Recorrido en finca de olivos", finca: "Lote Norte", loc: "Junín", dur: "2 h 30 min", precio: "7.500", seed: 2, photo: "hilera de olivos" },
  "cosecha-duraznos": { id: "cosecha-duraznos", titulo: "Cosecha de duraznos de estación", finca: "Lote Sur", loc: "Tunuyán", dur: "2 h 30 min", precio: "6.900", seed: 4, photo: "duraznos en el árbol" },
};

export function enTemporada(c: Cultivo): boolean {
  return c.calendario[MES_ACTUAL] === "h";
}

export function temporadaLabel(c: Cultivo): string {
  const months = c.calendario.map((s, i) => (s === "h" ? MESES[i] : null)).filter(Boolean) as string[];
  if (months.length === 0) return "Fuera de temporada";
  if (months.length === 1) return `Cosecha en ${months[0]}`;
  return `Cosecha: ${months[0]} – ${months[months.length - 1]}`;
}

export function getCultivo(id: string): Cultivo | undefined {
  return CULTIVOS.find((c) => c.id === id);
}

export function getReceta(id: string): Receta | undefined {
  return RECETAS.find((r) => r.id === id);
}

export function recetasDeCultivo(c: Cultivo): Receta[] {
  return c.recetas.map((id) => getReceta(id)).filter((r): r is Receta => Boolean(r));
}

export function actividadesDeCultivo(c: Cultivo): ActividadCultivo[] {
  return c.actividades.map((id) => ACTIVIDADES_CULTIVO[id]).filter(Boolean);
}
