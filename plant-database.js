/**
 * Plant information database for common landscaping plants.
 * Keyed by lowercase common name for fuzzy lookup.
 */
const PLANT_DB = {
  "boxwood": {
    common: "Boxwood",
    botanical: "Buxus sempervirens",
    type: "evergreen-shrub",
    size: "3-5 ft tall, 3-5 ft wide",
    bloom: "Spring (inconspicuous)",
    sun: "full-sun",
    water: "moderate",
    notes: "Classic evergreen hedge plant. Dense, rounded form. Deer resistant.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Buxus_sempervirens0.jpg/800px-Buxus_sempervirens0.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Buxus_sempervirens_%27Suffruticosa%27.jpg/800px-Buxus_sempervirens_%27Suffruticosa%27.jpg"
    ]
  },
  "hydrangea": {
    common: "Hydrangea",
    botanical: "Hydrangea macrophylla",
    type: "deciduous-shrub",
    size: "4-6 ft tall, 4-6 ft wide",
    bloom: "Summer - Fall",
    sun: "part-sun",
    water: "high",
    notes: "Showy clusters of blue, pink, or white flowers. Color varies with soil pH.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Hydrangea_macrophylla_-_Hortensia_hydrangea.jpg/800px-Hydrangea_macrophylla_-_Hortensia_hydrangea.jpg"
    ]
  },
  "lavender": {
    common: "Lavender",
    botanical: "Lavandula angustifolia",
    type: "perennial",
    size: "1-3 ft tall, 1-3 ft wide",
    bloom: "Summer",
    sun: "full-sun",
    water: "low",
    notes: "Fragrant purple flowers. Excellent for pollinators. Deer and rabbit resistant.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Lavandula_angustifolia_-_0001.jpg/800px-Lavandula_angustifolia_-_0001.jpg"
    ]
  },
  "hosta": {
    common: "Hosta",
    botanical: "Hosta spp.",
    type: "perennial",
    size: "1-3 ft tall, 2-4 ft wide",
    bloom: "Summer",
    sun: "part-shade",
    water: "moderate",
    notes: "Shade-loving foliage plant. Available in many leaf colors and patterns.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Hosta_%27Sagae%27.jpg/800px-Hosta_%27Sagae%27.jpg"
    ]
  },
  "daylily": {
    common: "Daylily",
    botanical: "Hemerocallis spp.",
    type: "perennial",
    size: "1-4 ft tall, 1-3 ft wide",
    bloom: "Summer",
    sun: "full-sun",
    water: "moderate",
    notes: "Easy-care perennial with trumpet-shaped flowers in many colors. Each bloom lasts one day.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Hemerocallis_lilioasphodelus_2.jpg/800px-Hemerocallis_lilioasphodelus_2.jpg"
    ]
  },
  "japanese maple": {
    common: "Japanese Maple",
    botanical: "Acer palmatum",
    type: "deciduous-tree",
    size: "10-25 ft tall, 10-25 ft wide",
    bloom: "Spring (inconspicuous)",
    sun: "part-sun",
    water: "moderate",
    notes: "Elegant ornamental tree with delicate, deeply lobed leaves. Stunning fall color.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Acer_palmatum_var_amoenum_%27Osakazuki%27_JPG1a.jpg/800px-Acer_palmatum_var_amoenum_%27Osakazuki%27_JPG1a.jpg"
    ]
  },
  "crepe myrtle": {
    common: "Crepe Myrtle",
    botanical: "Lagerstroemia indica",
    type: "deciduous-tree",
    size: "10-30 ft tall, 10-20 ft wide",
    bloom: "Summer - Fall",
    sun: "full-sun",
    water: "moderate",
    notes: "Long-blooming tree with showy flower clusters. Attractive peeling bark. Heat tolerant.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Lagerstroemia_indica_flowers.jpg/800px-Lagerstroemia_indica_flowers.jpg"
    ]
  },
  "knockout rose": {
    common: "Knockout Rose",
    botanical: "Rosa 'Knock Out'",
    type: "deciduous-shrub",
    size: "3-4 ft tall, 3-4 ft wide",
    bloom: "Spring - Fall",
    sun: "full-sun",
    water: "moderate",
    notes: "Continuous blooming, disease-resistant shrub rose. Low maintenance.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Rosa_Knock_Out_2.jpg/800px-Rosa_Knock_Out_2.jpg"
    ]
  },
  "blue fescue": {
    common: "Blue Fescue",
    botanical: "Festuca glauca",
    type: "ornamental-grass",
    size: "6-12 in tall, 6-10 in wide",
    bloom: "Summer",
    sun: "full-sun",
    water: "low",
    notes: "Compact blue-silver mounding grass. Deer resistant. Great for borders and rock gardens.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Festuca_glauca_a1.jpg/800px-Festuca_glauca_a1.jpg"
    ]
  },
  "liriope": {
    common: "Liriope",
    botanical: "Liriope muscari",
    type: "perennial",
    size: "12-18 in tall, 12-18 in wide",
    bloom: "Late Summer - Fall",
    sun: "part-shade",
    water: "moderate",
    notes: "Grass-like evergreen groundcover. Purple flower spikes. Very low maintenance.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Liriope_muscari1.jpg/800px-Liriope_muscari1.jpg"
    ]
  },
  "azalea": {
    common: "Azalea",
    botanical: "Rhododendron spp.",
    type: "evergreen-shrub",
    size: "3-6 ft tall, 3-6 ft wide",
    bloom: "Spring",
    sun: "part-shade",
    water: "moderate",
    notes: "Showy spring blooms in white, pink, red, or purple. Prefers acidic soil.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Azalea_japonica.jpg/800px-Azalea_japonica.jpg"
    ]
  },
  "camellia": {
    common: "Camellia",
    botanical: "Camellia japonica",
    type: "evergreen-shrub",
    size: "6-12 ft tall, 5-10 ft wide",
    bloom: "Winter - Spring",
    sun: "part-shade",
    water: "moderate",
    notes: "Glossy evergreen with rose-like flowers in winter. Prefers acidic, well-drained soil.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Camellia_japonica_flower_2.jpg/800px-Camellia_japonica_flower_2.jpg"
    ]
  },
  "gardenia": {
    common: "Gardenia",
    botanical: "Gardenia jasminoides",
    type: "evergreen-shrub",
    size: "3-6 ft tall, 3-6 ft wide",
    bloom: "Late Spring - Summer",
    sun: "part-sun",
    water: "moderate",
    notes: "Intensely fragrant white flowers. Glossy dark green foliage. Needs acidic soil.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Gardenia_jasminoides_cv1.jpg/800px-Gardenia_jasminoides_cv1.jpg"
    ]
  },
  "ornamental grass": {
    common: "Ornamental Grass",
    botanical: "Miscanthus sinensis",
    type: "ornamental-grass",
    size: "4-7 ft tall, 3-5 ft wide",
    bloom: "Late Summer - Fall",
    sun: "full-sun",
    water: "moderate",
    notes: "Tall graceful grass with feathery plumes. Great for screens and borders.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Miscanthus_sinensis_var._condensatus_%27Cosmopolitan%27.jpg/800px-Miscanthus_sinensis_var._condensatus_%27Cosmopolitan%27.jpg"
    ]
  },
  "fountain grass": {
    common: "Fountain Grass",
    botanical: "Pennisetum alopecuroides",
    type: "ornamental-grass",
    size: "2-4 ft tall, 2-3 ft wide",
    bloom: "Summer - Fall",
    sun: "full-sun",
    water: "low",
    notes: "Graceful arching form with fuzzy bottlebrush flower plumes.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Pennisetum_alopecuroides_Hameln2.jpg/800px-Pennisetum_alopecuroides_Hameln2.jpg"
    ]
  },
  "black-eyed susan": {
    common: "Black-Eyed Susan",
    botanical: "Rudbeckia fulgida",
    type: "perennial",
    size: "2-3 ft tall, 1-2 ft wide",
    bloom: "Summer - Fall",
    sun: "full-sun",
    water: "moderate",
    notes: "Bright yellow daisy-like flowers with dark centers. Native wildflower. Great for pollinators.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Rudbeckia_fulgida_var_sullivantii_%27Goldsturm%27.jpg/800px-Rudbeckia_fulgida_var_sullivantii_%27Goldsturm%27.jpg"
    ]
  },
  "coneflower": {
    common: "Coneflower",
    botanical: "Echinacea purpurea",
    type: "perennial",
    size: "2-4 ft tall, 1-2 ft wide",
    bloom: "Summer - Fall",
    sun: "full-sun",
    water: "low",
    notes: "Purple daisy-like flowers. Native plant, great for pollinators and butterflies.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Echinacea_purpurea_02.jpg/800px-Echinacea_purpurea_02.jpg"
    ]
  },
  "salvia": {
    common: "Salvia",
    botanical: "Salvia nemorosa",
    type: "perennial",
    size: "1-3 ft tall, 1-2 ft wide",
    bloom: "Late Spring - Summer",
    sun: "full-sun",
    water: "low",
    notes: "Spiky purple-blue flower stalks. Deer resistant. Attracts hummingbirds.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Salvia_nemorosa_%27Caradonna%27_01.JPG/800px-Salvia_nemorosa_%27Caradonna%27_01.JPG"
    ]
  },
  "russian sage": {
    common: "Russian Sage",
    botanical: "Perovskia atriplicifolia",
    type: "perennial",
    size: "3-5 ft tall, 3-4 ft wide",
    bloom: "Summer - Fall",
    sun: "full-sun",
    water: "low",
    notes: "Airy lavender-blue flower spires with silvery foliage. Extremely drought tolerant.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Perovskia_atriplicifolia_002.JPG/800px-Perovskia_atriplicifolia_002.JPG"
    ]
  },
  "holly": {
    common: "Holly",
    botanical: "Ilex spp.",
    type: "evergreen-shrub",
    size: "6-15 ft tall, 6-10 ft wide",
    bloom: "Spring (inconspicuous)",
    sun: "part-sun",
    water: "moderate",
    notes: "Glossy evergreen with red berries in winter. Great for hedges and screening.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Ilex_aquifolium_fruits.jpg/800px-Ilex_aquifolium_fruits.jpg"
    ]
  },
  "juniper": {
    common: "Juniper",
    botanical: "Juniperus spp.",
    type: "evergreen-shrub",
    size: "1-15 ft tall (varies by cultivar)",
    bloom: "Spring (inconspicuous)",
    sun: "full-sun",
    water: "low",
    notes: "Versatile evergreen. Groundcover to upright forms. Very drought tolerant.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Juniperus_chinensis_Pfitzeriana_Aurea_1.jpg/800px-Juniperus_chinensis_Pfitzeriana_Aurea_1.jpg"
    ]
  },
  "viburnum": {
    common: "Viburnum",
    botanical: "Viburnum spp.",
    type: "deciduous-shrub",
    size: "5-12 ft tall, 5-10 ft wide",
    bloom: "Spring",
    sun: "part-sun",
    water: "moderate",
    notes: "Clusters of white or pink flowers. Many species offer fall berries and good fall color.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Viburnum_opulus_flowers.jpg/800px-Viburnum_opulus_flowers.jpg"
    ]
  },
  "dogwood": {
    common: "Dogwood",
    botanical: "Cornus florida",
    type: "deciduous-tree",
    size: "15-25 ft tall, 15-25 ft wide",
    bloom: "Spring",
    sun: "part-sun",
    water: "moderate",
    notes: "Native ornamental tree with showy spring bracts. Red berries and purple fall foliage.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Cornus_florida_flowers.jpg/800px-Cornus_florida_flowers.jpg"
    ]
  },
  "magnolia": {
    common: "Magnolia",
    botanical: "Magnolia grandiflora",
    type: "evergreen-tree",
    size: "40-80 ft tall, 30-50 ft wide",
    bloom: "Late Spring - Summer",
    sun: "full-sun",
    water: "moderate",
    notes: "Large fragrant white flowers. Glossy evergreen leaves. Iconic Southern tree.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Magnolia_grandiflora_flower.jpg/800px-Magnolia_grandiflora_flower.jpg"
    ]
  },
  "tulip": {
    common: "Tulip",
    botanical: "Tulipa spp.",
    type: "perennial-bulb",
    size: "6-24 in tall",
    bloom: "Spring",
    sun: "full-sun",
    water: "moderate",
    notes: "Classic spring bulb available in virtually every color. Plant in fall for spring blooms.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Tulip_-_florAnswer.jpg/800px-Tulip_-_florAnswer.jpg"
    ]
  },
  "daffodil": {
    common: "Daffodil",
    botanical: "Narcissus spp.",
    type: "perennial-bulb",
    size: "6-20 in tall",
    bloom: "Early Spring",
    sun: "full-sun",
    water: "moderate",
    notes: "Cheerful spring bulb. Deer and rodent resistant. Naturalizes easily.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Narcissus_pseudonarcissus_%28daffodils%29.jpg/800px-Narcissus_pseudonarcissus_%28daffodils%29.jpg"
    ]
  },
  "iris": {
    common: "Iris",
    botanical: "Iris germanica",
    type: "perennial",
    size: "1-3 ft tall, 1-2 ft wide",
    bloom: "Spring - Early Summer",
    sun: "full-sun",
    water: "low",
    notes: "Elegant bearded flowers in many colors. Sword-shaped foliage. Drought tolerant once established.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Iris_germanica_%28Purple_bearded_iris%29%2C_Giverny.jpg/800px-Iris_germanica_%28Purple_bearded_iris%29%2C_Giverny.jpg"
    ]
  },
  "peony": {
    common: "Peony",
    botanical: "Paeonia lactiflora",
    type: "perennial",
    size: "2-3 ft tall, 2-3 ft wide",
    bloom: "Late Spring",
    sun: "full-sun",
    water: "moderate",
    notes: "Large, fragrant, ruffled flowers. Long-lived perennial. May need staking when in bloom.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Paeonia_lactiflora1.jpg/800px-Paeonia_lactiflora1.jpg"
    ]
  },
  "astilbe": {
    common: "Astilbe",
    botanical: "Astilbe spp.",
    type: "perennial",
    size: "1-4 ft tall, 1-3 ft wide",
    bloom: "Summer",
    sun: "part-shade",
    water: "high",
    notes: "Feathery plume flowers in pink, red, white, or purple. Great for shady, moist areas.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Astilbe_japonica_%27Europa%27.JPG/800px-Astilbe_japonica_%27Europa%27.JPG"
    ]
  },
  "fern": {
    common: "Fern",
    botanical: "Various",
    type: "fern",
    size: "1-4 ft tall, 1-3 ft wide",
    bloom: "Non-flowering",
    sun: "full-shade",
    water: "high",
    notes: "Ancient non-flowering plant. Elegant fronds for shaded areas. Many species available.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Athyrium_filix-femina_1.jpg/800px-Athyrium_filix-femina_1.jpg"
    ]
  },
  "sedum": {
    common: "Sedum",
    botanical: "Sedum spp.",
    type: "succulent",
    size: "3 in - 2 ft tall (varies)",
    bloom: "Summer - Fall",
    sun: "full-sun",
    water: "low",
    notes: "Succulent perennial. Extremely drought tolerant. Attractive to butterflies.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Sedum_telephium_ssp_maximum.jpg/800px-Sedum_telephium_ssp_maximum.jpg"
    ]
  },
  "yew": {
    common: "Yew",
    botanical: "Taxus spp.",
    type: "evergreen-shrub",
    size: "3-20 ft tall (varies by cultivar)",
    bloom: "Spring (inconspicuous)",
    sun: "part-shade",
    water: "moderate",
    notes: "Dense evergreen, excellent for formal hedges and foundation plantings. Shade tolerant.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Taxus_baccata_%28European_Yew%29.jpg/800px-Taxus_baccata_%28European_Yew%29.jpg"
    ]
  },
  "spirea": {
    common: "Spirea",
    botanical: "Spiraea spp.",
    type: "deciduous-shrub",
    size: "2-6 ft tall, 2-6 ft wide",
    bloom: "Spring - Summer",
    sun: "full-sun",
    water: "moderate",
    notes: "Easy-care flowering shrub. Clusters of white, pink, or red flowers.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Spiraea_japonica1.jpg/800px-Spiraea_japonica1.jpg"
    ]
  },
  "barberry": {
    common: "Barberry",
    botanical: "Berberis thunbergii",
    type: "deciduous-shrub",
    size: "3-6 ft tall, 4-7 ft wide",
    bloom: "Spring",
    sun: "full-sun",
    water: "low",
    notes: "Colorful foliage in purple, red, gold, or green. Thorny — good for barrier planting. Deer resistant.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Berberis_thunbergii_var_atropurpurea.jpg/800px-Berberis_thunbergii_var_atropurpurea.jpg"
    ]
  },
  "clematis": {
    common: "Clematis",
    botanical: "Clematis spp.",
    type: "vine",
    size: "8-20 ft tall (climbing)",
    bloom: "Spring - Fall (varies by species)",
    sun: "full-sun",
    water: "moderate",
    notes: "Flowering vine with showy blooms in many colors. Likes cool roots, warm tops.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Clematis_%27Nelly_Moser%27.jpg/800px-Clematis_%27Nelly_Moser%27.jpg"
    ]
  },
  "wisteria": {
    common: "Wisteria",
    botanical: "Wisteria sinensis",
    type: "vine",
    size: "15-30 ft (climbing)",
    bloom: "Spring",
    sun: "full-sun",
    water: "moderate",
    notes: "Dramatic cascading clusters of fragrant purple or white flowers. Vigorous grower — needs strong support.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Wisteria_sinensis_in_Jena.jpg/800px-Wisteria_sinensis_in_Jena.jpg"
    ]
  },
  "ivy": {
    common: "Ivy",
    botanical: "Hedera helix",
    type: "ground-cover",
    size: "6-8 in tall (groundcover), climbs to 80 ft",
    bloom: "Fall (inconspicuous)",
    sun: "part-shade",
    water: "moderate",
    notes: "Vigorous evergreen groundcover and climber. Can be invasive — needs management.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Hedera_helix_leaves.jpg/800px-Hedera_helix_leaves.jpg"
    ]
  },
  "pachysandra": {
    common: "Pachysandra",
    botanical: "Pachysandra terminalis",
    type: "ground-cover",
    size: "6-12 in tall, spreading",
    bloom: "Spring (inconspicuous)",
    sun: "full-shade",
    water: "moderate",
    notes: "Dense evergreen groundcover for shaded areas. Low maintenance once established.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Pachysandra_terminalis_02.jpg/800px-Pachysandra_terminalis_02.jpg"
    ]
  },
  "rhododendron": {
    common: "Rhododendron",
    botanical: "Rhododendron spp.",
    type: "evergreen-shrub",
    size: "4-10 ft tall, 4-10 ft wide",
    bloom: "Spring",
    sun: "part-shade",
    water: "moderate",
    notes: "Large, showy flower clusters. Evergreen foliage. Prefers acidic, well-drained soil.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rhododendron_catawbiense_a4.jpg/800px-Rhododendron_catawbiense_a4.jpg"
    ]
  },
  "lantana": {
    common: "Lantana",
    botanical: "Lantana camara",
    type: "perennial",
    size: "1-4 ft tall, 2-4 ft wide",
    bloom: "Spring - Fall",
    sun: "full-sun",
    water: "low",
    notes: "Multicolored flower clusters. Extremely heat and drought tolerant. Attracts butterflies.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Lantana_camara_flowers.jpg/800px-Lantana_camara_flowers.jpg"
    ]
  },
  "catmint": {
    common: "Catmint",
    botanical: "Nepeta faassenii",
    type: "perennial",
    size: "1-3 ft tall, 1-3 ft wide",
    bloom: "Late Spring - Fall",
    sun: "full-sun",
    water: "low",
    notes: "Profuse lavender-blue flowers. Aromatic gray-green foliage. Deer and rabbit resistant.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Nepeta_faassenii2.jpg/800px-Nepeta_faassenii2.jpg"
    ]
  },
  "rose of sharon": {
    common: "Rose of Sharon",
    botanical: "Hibiscus syriacus",
    type: "deciduous-shrub",
    size: "8-12 ft tall, 6-10 ft wide",
    bloom: "Summer - Fall",
    sun: "full-sun",
    water: "moderate",
    notes: "Late-blooming shrub with hibiscus-like flowers. Upright vase shape.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Hibiscus_syriacus_%27Oiseau_Bleu%27.jpg/800px-Hibiscus_syriacus_%27Oiseau_Bleu%27.jpg"
    ]
  },
  "nandina": {
    common: "Nandina",
    botanical: "Nandina domestica",
    type: "evergreen-shrub",
    size: "4-8 ft tall, 3-5 ft wide",
    bloom: "Spring",
    sun: "part-sun",
    water: "moderate",
    notes: "Heavenly bamboo. Colorful foliage year-round, bright red in winter. Red berries.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nandina_domestica3.jpg/800px-Nandina_domestica3.jpg"
    ]
  },
  "agapanthus": {
    common: "Agapanthus",
    botanical: "Agapanthus africanus",
    type: "perennial",
    size: "2-3 ft tall, 1-2 ft wide",
    bloom: "Summer",
    sun: "full-sun",
    water: "moderate",
    notes: "Lily of the Nile. Globes of blue or white flowers on tall stalks. Strap-like leaves.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Agapanthus_africanus_-_Botanischer_Garten_Berlin.jpg/800px-Agapanthus_africanus_-_Botanischer_Garten_Berlin.jpg"
    ]
  },
  "mondo grass": {
    common: "Mondo Grass",
    botanical: "Ophiopogon japonicus",
    type: "ground-cover",
    size: "4-12 in tall, spreading",
    bloom: "Summer (inconspicuous)",
    sun: "part-shade",
    water: "moderate",
    notes: "Dense, dark green grass-like groundcover. Excellent for borders and between stepping stones.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Ophiopogon_japonicus1.jpg/800px-Ophiopogon_japonicus1.jpg"
    ]
  },
  "mexican feather grass": {
    common: "Mexican Feather Grass",
    botanical: "Nassella tenuissima",
    type: "ornamental-grass",
    size: "1-2 ft tall, 1-2 ft wide",
    bloom: "Summer",
    sun: "full-sun",
    water: "low",
    notes: "Fine, wispy, thread-like foliage that sways in the breeze. Very drought tolerant.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Nassella_tenuissima.jpg/800px-Nassella_tenuissima.jpg"
    ]
  },
  "coral bells": {
    common: "Coral Bells",
    botanical: "Heuchera spp.",
    type: "perennial",
    size: "8-18 in tall, 12-18 in wide",
    bloom: "Late Spring - Summer",
    sun: "part-shade",
    water: "moderate",
    notes: "Grown primarily for colorful foliage in purple, lime, coral, silver. Delicate flower spikes.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Heuchera_%27Autumn_Leaves%27.jpg/800px-Heuchera_%27Autumn_Leaves%27.jpg"
    ]
  },
  "arborvitae": {
    common: "Arborvitae",
    botanical: "Thuja occidentalis",
    type: "evergreen-tree",
    size: "10-30 ft tall, 3-12 ft wide",
    bloom: "Spring (inconspicuous)",
    sun: "full-sun",
    water: "moderate",
    notes: "Columnar or pyramidal evergreen. Popular for privacy screens and hedges.",
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Thuja_occidentalis_Smaragd1.jpg/800px-Thuja_occidentalis_Smaragd1.jpg"
    ]
  }
};

/**
 * Genus-based plant info for when exact matches aren't found.
 * Provides basic info based on the genus (first word of botanical name).
 */
const GENUS_INFO = {
  // Trees
  "acer": { type: "deciduous-tree", sun: "part-sun", water: "moderate", notes: "Maple family" },
  "quercus": { type: "deciduous-tree", sun: "full-sun", water: "moderate", notes: "Oak family" },
  "betula": { type: "deciduous-tree", sun: "full-sun", water: "moderate", notes: "Birch family" },
  "cornus": { type: "deciduous-tree", sun: "part-sun", water: "moderate", notes: "Dogwood family" },
  "prunus": { type: "deciduous-tree", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Cherry/Plum family" },
  "malus": { type: "deciduous-tree", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Apple/Crabapple family" },
  "magnolia": { type: "deciduous-tree", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Magnolia family" },
  "cercis": { type: "deciduous-tree", sun: "full-sun", water: "moderate", bloom: "Early Spring", notes: "Redbud family" },
  "lagerstroemia": { type: "deciduous-tree", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Crepe myrtle family" },
  "picea": { type: "evergreen-tree", sun: "full-sun", water: "moderate", notes: "Spruce family" },
  "pinus": { type: "evergreen-tree", sun: "full-sun", water: "low", notes: "Pine family" },
  "thuja": { type: "evergreen-tree", sun: "full-sun", water: "moderate", notes: "Arborvitae family" },
  "tsuga": { type: "evergreen-tree", sun: "part-shade", water: "moderate", notes: "Hemlock family" },
  "abies": { type: "evergreen-tree", sun: "full-sun", water: "moderate", notes: "Fir family" },
  "cedrus": { type: "evergreen-tree", sun: "full-sun", water: "low", notes: "Cedar family" },
  "cryptomeria": { type: "evergreen-tree", sun: "full-sun", water: "moderate", notes: "Japanese cedar" },
  "metasequoia": { type: "deciduous-tree", sun: "full-sun", water: "moderate", notes: "Dawn redwood" },
  "ginkgo": { type: "deciduous-tree", sun: "full-sun", water: "moderate", notes: "Ginkgo - living fossil" },
  "amelanchier": { type: "deciduous-tree", sun: "part-sun", water: "moderate", bloom: "Spring", notes: "Serviceberry family" },
  "carpinus": { type: "deciduous-tree", sun: "part-sun", water: "moderate", notes: "Hornbeam family" },
  "fagus": { type: "deciduous-tree", sun: "part-sun", water: "moderate", notes: "Beech family" },
  "liquidambar": { type: "deciduous-tree", sun: "full-sun", water: "moderate", notes: "Sweetgum" },
  "nyssa": { type: "deciduous-tree", sun: "full-sun", water: "high", notes: "Tupelo/Black gum" },
  "liriodendron": { type: "deciduous-tree", sun: "full-sun", water: "moderate", notes: "Tulip tree" },
  "styrax": { type: "deciduous-tree", sun: "part-sun", water: "moderate", bloom: "Spring", notes: "Snowbell family" },
  "halesia": { type: "deciduous-tree", sun: "part-sun", water: "moderate", bloom: "Spring", notes: "Silverbell family" },
  "oxydendrum": { type: "deciduous-tree", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Sourwood" },
  "chionanthus": { type: "deciduous-tree", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Fringetree" },
  "cladrastis": { type: "deciduous-tree", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Yellowwood" },
  "zelkova": { type: "deciduous-tree", sun: "full-sun", water: "moderate", notes: "Elm relative" },
  "parrotia": { type: "deciduous-tree", sun: "full-sun", water: "moderate", notes: "Persian ironwood" },

  // Evergreen shrubs
  "ilex": { type: "evergreen-shrub", sun: "part-sun", water: "moderate", notes: "Holly family" },
  "buxus": { type: "evergreen-shrub", sun: "part-sun", water: "moderate", notes: "Boxwood family" },
  "rhododendron": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Rhododendron/Azalea family" },
  "camellia": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", bloom: "Winter-Spring", notes: "Camellia family" },
  "pieris": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", bloom: "Early Spring", notes: "Andromeda family" },
  "leucothoe": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", notes: "Drooping leucothoe" },
  "kalmia": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", bloom: "Late Spring", notes: "Mountain laurel" },
  "prunus": { type: "evergreen-shrub", sun: "full-sun", water: "moderate", notes: "Cherry laurel (evergreen varieties)" },
  "aucuba": { type: "evergreen-shrub", sun: "full-shade", water: "moderate", notes: "Gold dust plant" },
  "nandina": { type: "evergreen-shrub", sun: "part-sun", water: "moderate", notes: "Heavenly bamboo" },
  "osmanthus": { type: "evergreen-shrub", sun: "part-sun", water: "moderate", bloom: "Fall", notes: "Fragrant olive" },
  "ligustrum": { type: "evergreen-shrub", sun: "full-sun", water: "moderate", notes: "Privet family" },
  "euonymus": { type: "evergreen-shrub", sun: "full-sun", water: "moderate", notes: "Euonymus family" },
  "skimmia": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", notes: "Skimmia" },
  "sarcococca": { type: "evergreen-shrub", sun: "full-shade", water: "moderate", bloom: "Winter", notes: "Sweet box" },
  "cephalotaxus": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", notes: "Plum yew" },
  "taxus": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", notes: "Yew family" },
  "juniperus": { type: "evergreen-shrub", sun: "full-sun", water: "low", notes: "Juniper family" },
  "chamaecyparis": { type: "evergreen-shrub", sun: "full-sun", water: "moderate", notes: "False cypress" },
  "microbiota": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", notes: "Russian cypress" },
  "abelia": { type: "evergreen-shrub", sun: "full-sun", water: "moderate", bloom: "Summer-Fall", notes: "Abelia family" },
  "loropetalum": { type: "evergreen-shrub", sun: "part-sun", water: "moderate", bloom: "Spring", notes: "Chinese fringe flower" },
  "illicium": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", notes: "Anise tree" },
  "cleyera": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", notes: "Japanese cleyera" },
  "ternstroemia": { type: "evergreen-shrub", sun: "part-shade", water: "moderate", notes: "Cleyera relative" },
  "gardenia": { type: "evergreen-shrub", sun: "part-sun", water: "moderate", bloom: "Summer", notes: "Fragrant gardenia" },
  "distylium": { type: "evergreen-shrub", sun: "part-sun", water: "moderate", notes: "Distylium" },

  // Deciduous shrubs
  "hydrangea": { type: "deciduous-shrub", sun: "part-sun", water: "high", bloom: "Summer", notes: "Hydrangea family" },
  "viburnum": { type: "deciduous-shrub", sun: "part-sun", water: "moderate", bloom: "Spring", notes: "Viburnum family" },
  "spiraea": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Spring-Summer", notes: "Spirea family" },
  "weigela": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Late Spring", notes: "Weigela family" },
  "forsythia": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Early Spring", notes: "Forsythia" },
  "syringa": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Lilac family" },
  "philadelphus": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Late Spring", notes: "Mock orange" },
  "deutzia": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Deutzia family" },
  "fothergilla": { type: "deciduous-shrub", sun: "part-sun", water: "moderate", bloom: "Spring", notes: "Fothergilla - great fall color" },
  "itea": { type: "deciduous-shrub", sun: "part-sun", water: "high", bloom: "Summer", notes: "Virginia sweetspire" },
  "clethra": { type: "deciduous-shrub", sun: "part-shade", water: "high", bloom: "Summer", notes: "Summersweet" },
  "callicarpa": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", notes: "Beautyberry - purple berries" },
  "berberis": { type: "deciduous-shrub", sun: "full-sun", water: "low", notes: "Barberry family" },
  "cotinus": { type: "deciduous-shrub", sun: "full-sun", water: "low", bloom: "Summer", notes: "Smoke bush" },
  "hibiscus": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Summer-Fall", notes: "Rose of Sharon" },
  "hamamelis": { type: "deciduous-shrub", sun: "part-sun", water: "moderate", bloom: "Winter-Spring", notes: "Witch hazel" },
  "corylopsis": { type: "deciduous-shrub", sun: "part-shade", water: "moderate", bloom: "Early Spring", notes: "Winter hazel" },
  "edgeworthia": { type: "deciduous-shrub", sun: "part-shade", water: "moderate", bloom: "Winter", notes: "Paperbush" },
  "calycanthus": { type: "deciduous-shrub", sun: "part-sun", water: "moderate", bloom: "Late Spring", notes: "Sweetshrub" },
  "hypericum": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "St. John's wort" },
  "physocarpus": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Ninebark" },
  "aronia": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Chokeberry" },
  "sambucus": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Elderberry" },
  "lindera": { type: "deciduous-shrub", sun: "part-sun", water: "moderate", bloom: "Early Spring", notes: "Spicebush" },
  "myrica": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", notes: "Bayberry" },
  "rosa": { type: "deciduous-shrub", sun: "full-sun", water: "moderate", bloom: "Spring-Fall", notes: "Rose family" },

  // Perennials
  "hosta": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Summer", notes: "Shade-loving foliage plant" },
  "heuchera": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Summer", notes: "Coral bells - colorful foliage" },
  "astilbe": { type: "perennial", sun: "part-shade", water: "high", bloom: "Summer", notes: "Feathery plumes for shade" },
  "helleborus": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Late Winter-Spring", notes: "Lenten rose" },
  "epimedium": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Barrenwort - great groundcover" },
  "brunnera": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Siberian bugloss" },
  "pulmonaria": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Lungwort" },
  "tiarella": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Foamflower" },
  "heucherella": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Heuchera x Tiarella hybrid" },
  "polygonatum": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Solomon's seal" },
  "disporum": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Fairy bells" },
  "anemone": { type: "perennial", sun: "part-sun", water: "moderate", bloom: "Fall", notes: "Japanese anemone" },
  "echinacea": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer", notes: "Coneflower" },
  "rudbeckia": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer-Fall", notes: "Black-eyed Susan" },
  "salvia": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer", notes: "Sage family" },
  "nepeta": { type: "perennial", sun: "full-sun", water: "low", bloom: "Spring-Fall", notes: "Catmint" },
  "lavandula": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer", notes: "Lavender" },
  "perovskia": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer-Fall", notes: "Russian sage" },
  "sedum": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer-Fall", notes: "Stonecrop" },
  "geranium": { type: "perennial", sun: "part-sun", water: "moderate", bloom: "Spring-Summer", notes: "Hardy geranium (cranesbill)" },
  "phlox": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Phlox family" },
  "leucanthemum": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Shasta daisy" },
  "coreopsis": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer", notes: "Tickseed" },
  "gaillardia": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer", notes: "Blanket flower" },
  "agastache": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer", notes: "Hyssop - attracts pollinators" },
  "monarda": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Bee balm" },
  "achillea": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer", notes: "Yarrow" },
  "paeonia": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Late Spring", notes: "Peony" },
  "iris": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Iris family" },
  "hemerocallis": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Daylily" },
  "agapanthus": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Lily of the Nile" },
  "liatris": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer", notes: "Blazing star" },
  "veronica": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Speedwell" },
  "amsonia": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Blue star - great fall color" },
  "baptisia": { type: "perennial", sun: "full-sun", water: "low", bloom: "Spring", notes: "False indigo" },
  "euphorbia": { type: "perennial", sun: "full-sun", water: "low", bloom: "Spring", notes: "Spurge family" },
  "dianthus": { type: "perennial", sun: "full-sun", water: "low", bloom: "Spring-Summer", notes: "Pinks" },
  "campanula": { type: "perennial", sun: "part-sun", water: "moderate", bloom: "Summer", notes: "Bellflower" },
  "digitalis": { type: "perennial", sun: "part-sun", water: "moderate", bloom: "Early Summer", notes: "Foxglove" },
  "aquilegia": { type: "perennial", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Columbine" },
  "delphinium": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Larkspur" },
  "kniphofia": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Red hot poker" },
  "crocosmia": { type: "perennial", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Montbretia" },
  "alchemilla": { type: "perennial", sun: "part-sun", water: "moderate", bloom: "Summer", notes: "Lady's mantle" },
  "stachys": { type: "perennial", sun: "full-sun", water: "low", bloom: "Summer", notes: "Lamb's ear" },
  "artemisia": { type: "perennial", sun: "full-sun", water: "low", notes: "Silvery foliage plant" },
  "ajuga": { type: "ground-cover", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Bugleweed groundcover" },
  "vinca": { type: "ground-cover", sun: "part-shade", water: "moderate", bloom: "Spring", notes: "Periwinkle groundcover" },
  "pachysandra": { type: "ground-cover", sun: "full-shade", water: "moderate", notes: "Japanese spurge groundcover" },
  "liriope": { type: "ground-cover", sun: "part-shade", water: "moderate", bloom: "Late Summer", notes: "Lilyturf" },
  "ophiopogon": { type: "ground-cover", sun: "part-shade", water: "moderate", notes: "Mondo grass" },
  "hakonechloa": { type: "ornamental-grass", sun: "part-shade", water: "moderate", notes: "Japanese forest grass" },

  // Ornamental grasses
  "miscanthus": { type: "ornamental-grass", sun: "full-sun", water: "moderate", bloom: "Late Summer", notes: "Maiden grass" },
  "panicum": { type: "ornamental-grass", sun: "full-sun", water: "moderate", bloom: "Fall", notes: "Switch grass" },
  "pennisetum": { type: "ornamental-grass", sun: "full-sun", water: "low", bloom: "Summer", notes: "Fountain grass" },
  "calamagrostis": { type: "ornamental-grass", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Feather reed grass" },
  "festuca": { type: "ornamental-grass", sun: "full-sun", water: "low", notes: "Blue fescue" },
  "carex": { type: "ornamental-grass", sun: "part-shade", water: "moderate", notes: "Sedge family" },
  "nassella": { type: "ornamental-grass", sun: "full-sun", water: "low", notes: "Mexican feather grass" },
  "schizachyrium": { type: "ornamental-grass", sun: "full-sun", water: "low", bloom: "Fall", notes: "Little bluestem" },
  "muhlenbergia": { type: "ornamental-grass", sun: "full-sun", water: "low", bloom: "Fall", notes: "Muhly grass" },
  "sporobolus": { type: "ornamental-grass", sun: "full-sun", water: "low", bloom: "Fall", notes: "Prairie dropseed" },
  "andropogon": { type: "ornamental-grass", sun: "full-sun", water: "low", bloom: "Fall", notes: "Big bluestem" },
  "chasmanthium": { type: "ornamental-grass", sun: "part-shade", water: "moderate", bloom: "Summer", notes: "Northern sea oats" },
  "sesleria": { type: "ornamental-grass", sun: "part-sun", water: "moderate", notes: "Moor grass" },
  "deschampsia": { type: "ornamental-grass", sun: "part-sun", water: "moderate", bloom: "Summer", notes: "Tufted hair grass" },
  "molinia": { type: "ornamental-grass", sun: "full-sun", water: "moderate", bloom: "Fall", notes: "Moor grass" },
  "juncus": { type: "ornamental-grass", sun: "full-sun", water: "high", notes: "Rush family" },
  "acorus": { type: "ornamental-grass", sun: "full-sun", water: "high", notes: "Sweet flag" },

  // Ferns
  "athyrium": { type: "fern", sun: "part-shade", water: "moderate", notes: "Lady fern" },
  "dryopteris": { type: "fern", sun: "part-shade", water: "moderate", notes: "Wood fern" },
  "polystichum": { type: "fern", sun: "part-shade", water: "moderate", notes: "Christmas/Shield fern" },
  "osmunda": { type: "fern", sun: "part-shade", water: "high", notes: "Royal fern" },
  "matteuccia": { type: "fern", sun: "part-shade", water: "high", notes: "Ostrich fern" },
  "adiantum": { type: "fern", sun: "part-shade", water: "moderate", notes: "Maidenhair fern" },
  "cyrtomium": { type: "fern", sun: "part-shade", water: "moderate", notes: "Holly fern" },

  // Vines
  "clematis": { type: "vine", sun: "full-sun", water: "moderate", bloom: "Spring-Fall", notes: "Flowering vine" },
  "wisteria": { type: "vine", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Cascading flower clusters" },
  "lonicera": { type: "vine", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Honeysuckle" },
  "hydrangea": { type: "vine", sun: "part-shade", water: "moderate", bloom: "Summer", notes: "Climbing hydrangea" },
  "schizophragma": { type: "vine", sun: "part-shade", water: "moderate", bloom: "Summer", notes: "Japanese hydrangea vine" },
  "parthenocissus": { type: "vine", sun: "part-sun", water: "moderate", notes: "Virginia creeper / Boston ivy" },
  "campsis": { type: "vine", sun: "full-sun", water: "moderate", bloom: "Summer", notes: "Trumpet vine" },
  "trachelospermum": { type: "vine", sun: "part-sun", water: "moderate", bloom: "Spring", notes: "Star jasmine" },
  "hedera": { type: "vine", sun: "part-shade", water: "moderate", notes: "Ivy" },
  "gelsemium": { type: "vine", sun: "full-sun", water: "moderate", bloom: "Early Spring", notes: "Carolina jessamine" },
  "bignonia": { type: "vine", sun: "full-sun", water: "moderate", bloom: "Spring", notes: "Crossvine" },
  "decumaria": { type: "vine", sun: "part-shade", water: "moderate", bloom: "Summer", notes: "Climbing hydrangea relative" },
  "ficus": { type: "vine", sun: "part-shade", water: "moderate", notes: "Climbing fig" }
};

/**
 * Look up a plant by name. Tries multiple matching strategies.
 * Returns the DB entry or null.
 */
function lookupPlant(name) {
  if (!name) return null;

  // Clean the input name using LegendParser if available
  let cleanName = name;
  if (typeof LegendParser !== 'undefined' && LegendParser.extractCorePlantName) {
    cleanName = LegendParser.extractCorePlantName(name);
  } else if (typeof LegendParser !== 'undefined' && LegendParser.cleanOcrText) {
    cleanName = LegendParser.cleanOcrText(name);
  }

  const key = cleanName.toLowerCase().trim();
  const originalKey = name.toLowerCase().trim();

  // 1. Exact match on cleaned name
  if (PLANT_DB[key]) return PLANT_DB[key];

  // 2. Exact match on original name
  if (PLANT_DB[originalKey]) return PLANT_DB[originalKey];

  // 3. Check if input contains a DB key AND the DB key is substantial (>60% of input length)
  // This prevents "ilex" from matching "ilex crenata 'northern beauty'"
  for (const k of Object.keys(PLANT_DB)) {
    if (key.includes(k) && k.length >= key.length * 0.6) {
      return PLANT_DB[k];
    }
  }

  // 4. Check botanical names - require genus AND species match for specificity
  for (const k of Object.keys(PLANT_DB)) {
    const entry = PLANT_DB[k];
    if (entry.botanical) {
      const botanical = entry.botanical.toLowerCase();
      // Exact botanical match
      if (key === botanical || originalKey === botanical) {
        return entry;
      }
      // Check if input starts with the full botanical name (allows for cultivar suffix)
      if (key.startsWith(botanical) || originalKey.startsWith(botanical)) {
        return entry;
      }
      // Check genus + species (first two words)
      const botanicalParts = botanical.split(' ');
      if (botanicalParts.length >= 2) {
        const genusSpecies = botanicalParts.slice(0, 2).join(' ');
        if (key.includes(genusSpecies) || originalKey.includes(genusSpecies)) {
          return entry;
        }
      }
    }
  }

  // 5. Word-based matching - require first word (likely genus) to match exactly
  const inputWords = key.split(/\s+/).filter(w => w.length > 2);
  if (inputWords.length > 0) {
    const firstWord = inputWords[0];
    for (const k of Object.keys(PLANT_DB)) {
      const dbWords = k.split(/\s+/);
      // First word must match and DB key should have multiple words (not just genus)
      if (dbWords[0] === firstWord && dbWords.length > 1) {
        return PLANT_DB[k];
      }
    }
  }

  // 6. Fuzzy match: check for similar spellings (only for similar-length strings)
  for (const k of Object.keys(PLANT_DB)) {
    if (similarEnough(key, k)) return PLANT_DB[k];
  }

  // 7. Genus-based lookup - extract first word and try GENUS_INFO
  const genusMatch = lookupByGenus(name);
  if (genusMatch) return genusMatch;

  return null;
}

/**
 * Look up plant info based on genus (first word of botanical name).
 * Returns a synthetic DB entry with basic info.
 */
function lookupByGenus(name) {
  if (!name) return null;

  const cleanName = name.trim();

  // Extract the botanical part before any cultivar name in quotes
  // e.g., "Ilex crenata 'Northern Beauty'" → "Ilex crenata"
  // e.g., "Rosa 'Knock Out'" → "Rosa"
  let botanicalPart = cleanName;
  const quoteIndex = cleanName.indexOf("'");
  if (quoteIndex > 0) {
    botanicalPart = cleanName.substring(0, quoteIndex).trim();
  }

  // Also handle dashes that might separate botanical from common name
  // e.g., "Carex elata - Bowles Golden" → "Carex elata"
  const dashIndex = botanicalPart.indexOf(' - ');
  if (dashIndex > 0) {
    botanicalPart = botanicalPart.substring(0, dashIndex).trim();
  }

  // Try to extract genus from the botanical part
  const words = botanicalPart.split(/\s+/).filter(w => w.length > 0);

  // Try each word as a potential genus (botanical names usually start with genus)
  for (const word of words) {
    const lowerWord = word.toLowerCase();
    if (GENUS_INFO[lowerWord]) {
      const info = GENUS_INFO[lowerWord];
      // Return a synthetic entry with the original name and genus-based info
      return {
        common: cleanName,
        botanical: botanicalPart,
        type: info.type || '',
        size: info.size || '',
        bloom: info.bloom || '',
        sun: info.sun || '',
        water: info.water || '',
        notes: info.notes || ''
      };
    }
  }

  return null;
}

/**
 * Simple similarity check for fuzzy matching.
 * Returns true if strings are similar enough (allowing for minor typos).
 */
function similarEnough(a, b) {
  if (Math.abs(a.length - b.length) > 2) return false;

  // Check if strings share most characters
  let matches = 0;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;

  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }

  // Require at least 80% character match for short strings
  const threshold = shorter.length < 5 ? 0.9 : 0.8;
  return matches / shorter.length >= threshold && longer.startsWith(shorter.substring(0, 3));
}

/**
 * Get all plant names for autocomplete.
 */
function getPlantNames() {
  return Object.values(PLANT_DB).map(p => p.common);
}
