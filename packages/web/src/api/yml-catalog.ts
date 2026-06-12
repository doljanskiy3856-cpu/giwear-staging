/**
 * YML Catalog parser (Yandex Market Format)
 * Fetches from external URL, parses XML, groups offers by group_id → Product[]
 * In-memory cache with 5 min TTL
 */

import type { Product, ProductVariant, OfferEntry } from "../web/data/products";
import {
  detectIsChildren,
  detectProductType,
  detectSportSlug,
  getSportLabel,
  normalizeCategorySlugByMeta,
  type ProductType,
  type SportSlug,
} from "../lib/categories";

const YML_URL =
  process.env.YML_CATALOG_URL ||
  "https://kintayo.salesdrive.me/export/yml/export.yml?publicKey=qMA7hvyfa9nBtocvqo7UsLJWSYLeTX-Iyf1ExYd0Hol7seq1jae9xXB8DWBor6Qwhtfi4f_s";

// ─── Image overrides ────────────────────────────────────────────────────────
// Replaces low-quality CDN images with high-resolution uploads.
// Key = YML groupId. Value = map of color → ordered image URLs.
// "Білий"|"white" — Ukrainian color name from YML params.
// size_1 / size_2 kept from original CDN (size chart, unchanged).
// ─── Blue IJF (LEGEND 2 IJF Slim Fit, id 1381) ───────────────────────────────
// Order: man front, man side, man back, man closeup, woman front, woman closeup
// + Slim Fit size charts (kept from original CDN)
const IJF_BLUE_IMAGES_SLIM = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F444iD1s6z_GXAV__nFOhd%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_1qITQylfliHaGg_YFO8Qf.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FvaVK7CrzEOaV7gVAfzCUq%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_4HQehZzvbu2HSe_XawKXb.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FJ5BtsNe7YlsaNcLFEDk4p%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_5iskoL5XKOVyJN_-lUxIn.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FopjynB8Y0OoxiKX5fUMmr%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_6nV6j8bp8SHHq9_YISBJP.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F_VTIS5zVAXYL05AbfKd06%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_7tO1Q9yEuIr6AY_DZfsAF.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FUVMMSd0Vj0-GTQG-QKtnP%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_8_(1)_6Bctdw.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbJweFdQma_U0sspXHfJ9B%2FSize-chart-IG-IJF-Judojacke-Legend-2_(1)_dEMKFo.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FcZ7QbxMRVcqszKpuoXudU%2FSize-chart-IG-IJF-Judo-Pant_(1)_Zy_TsY.jpg",
  // IJF Pant blue photos
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FXsLpMIfoHQT-i1nBJyzCN%2FIPPONGEAR_IJF_Pant_blue_1uvtdof2YUqZgVTW5XSR4pxzkm5_zSiRR-.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FT2OhfLgaPou1TCwBkBdg9%2FIPPONGEAR_IJF_Pant_blue_2D8BKPwKzQv3i85xdMJhPbXBp6J_ny-XTY.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FKALsswH_lZ1wf3v_-8CI0%2FIPPONGEAR_IJF_Pant_blue_3MKXplD6YCx73jEZ3d7zCl5gDUs_ykfZuB.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FtqvUWkZ_NLNHMSNCHtPnl%2FIPPONGEAR_IJF_Pant_blue_4W48AYcabPVmB8Ptfdp2yTwvvUU_CU-Hn7.jpg",
];

// ─── Blue IJF Women (LEGEND 2 IJF Women, id 1198) ───────────────────────────
// Order: woman front, woman closeup, man front, man closeup, man side, man back
// + Regular IJF size charts
const IJF_BLUE_IMAGES_WOMEN = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FYQ3yMQEszDqPW_iYCmhEn%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_7tO1Q9yEuIr6AY_JdHgb-.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbrLe7e5WB_0rslZp0oX_Y%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_8_(1)_I2xAfZ.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FMTWzhMh57_trF4XlSLPa6%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_1qITQylfliHaGg_LqeFJv.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FBsgJgyDn4Ag4GGWmNo8QW%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_6nV6j8bp8SHHq9_mnDVan.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FY3Mp4JJCdOIX2-R4bJ3lp%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_4HQehZzvbu2HSe_phnJpy.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F4G4zI-K3h-2QFHR5NlnPF%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_5iskoL5XKOVyJN_X6P697.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbJweFdQma_U0sspXHfJ9B%2FSize-chart-IG-IJF-Judojacke-Legend-2_(1)_dEMKFo.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FcZ7QbxMRVcqszKpuoXudU%2FSize-chart-IG-IJF-Judo-Pant_(1)_Zy_TsY.jpg",
  // IJF Pant blue photos
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FXsLpMIfoHQT-i1nBJyzCN%2FIPPONGEAR_IJF_Pant_blue_1uvtdof2YUqZgVTW5XSR4pxzkm5_zSiRR-.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FT2OhfLgaPou1TCwBkBdg9%2FIPPONGEAR_IJF_Pant_blue_2D8BKPwKzQv3i85xdMJhPbXBp6J_ny-XTY.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FKALsswH_lZ1wf3v_-8CI0%2FIPPONGEAR_IJF_Pant_blue_3MKXplD6YCx73jEZ3d7zCl5gDUs_ykfZuB.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FtqvUWkZ_NLNHMSNCHtPnl%2FIPPONGEAR_IJF_Pant_blue_4W48AYcabPVmB8Ptfdp2yTwvvUU_CU-Hn7.jpg",
];

// ─── White IJF ────────────────────────────────────────────────────────────────
const IJF_WHITE_IMAGES_REGULAR = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FX87GfPbmghcWgXN7nhA6Z%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_1EJX7ljh8mmfW6_-VxfTX.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F1FOr424KbAyprcqcZ56qm%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_2NNgJX8kANxfRd_Cu6TpD.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fj1nqx4k8X1wmf4wOG2YC0%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_3LQrvFPV7qWOfM_Jwx-P9.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FFH9USA5zX6jUG1iv9PA5x%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_4YeRzpO9xJ5m5K_fON7iA.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FttVJtv_nT8Uxdrcc6ef7f%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_55L4KWxMQYNST9_YNyFC1.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FGvgJBfdN6vLvvUTec8t2w%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_6O0hAgHuXQsPxd_ZlqZ4I.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbJweFdQma_U0sspXHfJ9B%2FSize-chart-IG-IJF-Judojacke-Legend-2_(1)_dEMKFo.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FcZ7QbxMRVcqszKpuoXudU%2FSize-chart-IG-IJF-Judo-Pant_(1)_Zy_TsY.jpg",
  // IJF Pant white photos
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FaVK7o_hsGBB4pNPzAA4lA%2FIPPONGEAR_IJF_Pant_white_1LxcGEIvP4V6UzrV8LnAvDW84Ml_vb_p9g.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FqDDDMW_ByxIDxJT5t4vJT%2FIPPONGEAR_IJF_Pant_white_2zqewwAtfLG44XmftHOnfHJ2x6V_dBVBD0.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FKXlg8mu-lmhxY-5LR8F8-%2FIPPONGEAR_IJF_Pant_white_3g0Bqhi90NpMubzS82mml5k1X2z_J7n06B.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FukfoQfVTgoEPzPeUGCUM-%2FIPPONGEAR_IJF_Pant_white_4OjvjQXrcpeI5fKfdMCq3301txz_mbgyhJ.jpg",
];
const IJF_WHITE_IMAGES_WOMEN = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FttVJtv_nT8Uxdrcc6ef7f%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_55L4KWxMQYNST9_YNyFC1.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FGvgJBfdN6vLvvUTec8t2w%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_6O0hAgHuXQsPxd_ZlqZ4I.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FX87GfPbmghcWgXN7nhA6Z%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_1EJX7ljh8mmfW6_-VxfTX.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F1FOr424KbAyprcqcZ56qm%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_2NNgJX8kANxfRd_Cu6TpD.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fj1nqx4k8X1wmf4wOG2YC0%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_3LQrvFPV7qWOfM_Jwx-P9.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FFH9USA5zX6jUG1iv9PA5x%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_4YeRzpO9xJ5m5K_fON7iA.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbJweFdQma_U0sspXHfJ9B%2FSize-chart-IG-IJF-Judojacke-Legend-2_(1)_dEMKFo.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FcZ7QbxMRVcqszKpuoXudU%2FSize-chart-IG-IJF-Judo-Pant_(1)_Zy_TsY.jpg",
  // IJF Pant white photos
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FaVK7o_hsGBB4pNPzAA4lA%2FIPPONGEAR_IJF_Pant_white_1LxcGEIvP4V6UzrV8LnAvDW84Ml_vb_p9g.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FqDDDMW_ByxIDxJT5t4vJT%2FIPPONGEAR_IJF_Pant_white_2zqewwAtfLG44XmftHOnfHJ2x6V_dBVBD0.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FKXlg8mu-lmhxY-5LR8F8-%2FIPPONGEAR_IJF_Pant_white_3g0Bqhi90NpMubzS82mml5k1X2z_J7n06B.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FukfoQfVTgoEPzPeUGCUM-%2FIPPONGEAR_IJF_Pant_white_4OjvjQXrcpeI5fKfdMCq3301txz_mbgyhJ.jpg",
];

// ─── Blue IJF Regular (LEGEND 2 IJF Regular blue, id 366) ────────────────────
// Original YML photos kept + HQ size charts + blue pant photos
const IJF_BLUE_IMAGES_REGULAR = [
  "https://static.kintayo.com/images/ippon/p/legend-2/IPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_1rYIdkbXNY4Nu6.jpg",
  "https://static.kintayo.com/images/ippon/p/legend-2/IPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_4fBUdqovNDgfVf.jpg",
  "https://static.kintayo.com/images/ippon/p/legend-2/IPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_5Vy6KUsHS2XUCt.jpg",
  "https://static.kintayo.com/images/ippon/p/legend-2/IPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_blue_6CyOq3V7FPRLzT.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbJweFdQma_U0sspXHfJ9B%2FSize-chart-IG-IJF-Judojacke-Legend-2_(1)_dEMKFo.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FcZ7QbxMRVcqszKpuoXudU%2FSize-chart-IG-IJF-Judo-Pant_(1)_Zy_TsY.jpg",
  // IJF Pant blue photos
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FXsLpMIfoHQT-i1nBJyzCN%2FIPPONGEAR_IJF_Pant_blue_1uvtdof2YUqZgVTW5XSR4pxzkm5_zSiRR-.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FT2OhfLgaPou1TCwBkBdg9%2FIPPONGEAR_IJF_Pant_blue_2D8BKPwKzQv3i85xdMJhPbXBp6J_ny-XTY.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FKALsswH_lZ1wf3v_-8CI0%2FIPPONGEAR_IJF_Pant_blue_3MKXplD6YCx73jEZ3d7zCl5gDUs_ykfZuB.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FtqvUWkZ_NLNHMSNCHtPnl%2FIPPONGEAR_IJF_Pant_blue_4W48AYcabPVmB8Ptfdp2yTwvvUU_CU-Hn7.jpg",
];

// ─── White IJF Slim (LEGEND 2 IJF Slim Fit white, id 1381) ───────────────────
// Original YML photos kept + HQ size charts + white pant photos
const IJF_WHITE_IMAGES_SLIM = [
  // HQ product photos (same as Regular — same jacket/pant, Slim Fit cut)
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FX87GfPbmghcWgXN7nhA6Z%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_1EJX7ljh8mmfW6_-VxfTX.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F1FOr424KbAyprcqcZ56qm%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_2NNgJX8kANxfRd_Cu6TpD.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fj1nqx4k8X1wmf4wOG2YC0%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_3LQrvFPV7qWOfM_Jwx-P9.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FFH9USA5zX6jUG1iv9PA5x%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_4YeRzpO9xJ5m5K_fON7iA.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FttVJtv_nT8Uxdrcc6ef7f%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_55L4KWxMQYNST9_YNyFC1.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FGvgJBfdN6vLvvUTec8t2w%2FIPPONGEAR_Legend_2_IJF_Judo_Uniform_Jacket_white_6O0hAgHuXQsPxd_ZlqZ4I.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbJweFdQma_U0sspXHfJ9B%2FSize-chart-IG-IJF-Judojacke-Legend-2_(1)_dEMKFo.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FcZ7QbxMRVcqszKpuoXudU%2FSize-chart-IG-IJF-Judo-Pant_(1)_Zy_TsY.jpg",
  // IJF Pant white photos
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FaVK7o_hsGBB4pNPzAA4lA%2FIPPONGEAR_IJF_Pant_white_1LxcGEIvP4V6UzrV8LnAvDW84Ml_vb_p9g.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FqDDDMW_ByxIDxJT5t4vJT%2FIPPONGEAR_IJF_Pant_white_2zqewwAtfLG44XmftHOnfHJ2x6V_dBVBD0.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FKXlg8mu-lmhxY-5LR8F8-%2FIPPONGEAR_IJF_Pant_white_3g0Bqhi90NpMubzS82mml5k1X2z_J7n06B.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FukfoQfVTgoEPzPeUGCUM-%2FIPPONGEAR_IJF_Pant_white_4OjvjQXrcpeI5fKfdMCq3301txz_mbgyhJ.jpg",
];

/**
 * IMAGE_OVERRIDES: groupId → { colorKeyword → images[] }
 * colorKeyword matched case-insensitively against the YML color param.
 * "women" flag = use women-first image order for this groupId.
 */
// ─── NXT Boys (Blue) ─────────────────────────────────────────────────────────
const NXT_BOYS_IMAGES = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FBKZ3dghdg9Dz-1K2vVQJf%2FIPPONGEAR_NXT_Kids_Judogi_blue_01_(1)_ey4ZWE.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FCE87oCimlRczxsT-8U-Oz%2FIPPONGEAR_NXT_Kids_Judogi_blue_02_02_(1)_UWboPc.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FBe9V8ZCeO11VN2VnrS2ho%2FIPPONGEAR_NXT_Kids_Judogi_blue_03_(1)_Ihf8T1.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FVYWjUqfhlVQ76Gf6CRhMX%2FIPPONGEAR_NXT_Kids_Judogi_blue_04_(1)_HBbfow.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FGP2BDOuntF2wrpzZDhdcD%2FIPPONGEAR_NXT_Kids_Judogi_blue_05_(1)_4JCc1a.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fb_OjTaMwhxsLbtNN42Ak6%2FSize-chart-IG-Judoanzug-NXT_(1)_bBwL28.jpg",
];

// ─── NXT Red (Girls) ─────────────────────────────────────────────────────────
const NXT_RED_IMAGES = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FyRHiCM3kcUZm-TmeTsCC3%2FIPPONGEAR_NXT_Kids_Judogi_red_01_fD9wlt.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FudQBvEO28GllWRwiJOE2T%2FIPPONGEAR_NXT_Kids_Judogi_red_02_0bQBv6.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FLCIlCrTQeCXqB90oZiKG3%2FIPPONGEAR_NXT_Kids_Judogi_red_03_OIYEWC.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fij98TfuQb-g93X8R49nBs%2FIPPONGEAR_NXT_Kids_Judogi_red_04_AoumMC.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FcgPKY0UE1det18JPeCGN9%2FIPPONGEAR_NXT_Kids_Judogi_red_05_vLbjj7.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fp8Z59dP3l9JMLKsnqIE7s%2FIPPONGEAR_NXT_Kids_Judogi_red_06_chSLPT.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fb_OjTaMwhxsLbtNN42Ak6%2FSize-chart-IG-Judoanzug-NXT_(1)_bBwL28.jpg",
];

// ─── ULTRALIGHT White ────────────────────────────────────────────────────────
const ULTRALIGHT_WHITE_IMAGES = [
  // HQ product photos (new)
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FZ0ARZSewclpXmsJCP8EU6%2FIPPONGEAR_Judo_Uniform_Jacket_Ultralight_white_front_2_5cWPF4.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FYxBQlb-hLvn3xLac8y52D%2FIPPONGEAR_Judo_Uniform_Jacket_Ultralight_white_half_side_2_K5vHG4.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FLqJjNbcbaoY1Jiw2gifOG%2FIPPONGEAR_Judo_Uniform_Jacket_Ultralight_white_side_kJRmd7.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FeMYSn1fyNrW_QYlKd55S4%2FIPPONGEAR_Judo_Uniform_Jacket_Ultralight_white_back_Mhsi9H.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F6Uzgg8bLgxqXTC5p4chEs%2FIPPONGEAR_Judo_Uniform_Jacket_Ultralight_white_emotion_LVxA4g.jpg",
  // Size charts
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F4dEV7sKUT0JzRd-yZ40vM%2FSize-chart-IG-Judojacke-Ultralight_(1)_UvTfcW.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F4L2QAH6eDK4EbGYf2ER2t%2FSize-chart-IG-Judo-Pant_(1)_VrPOBv.jpg",
];

// ─── FUTURE 2 White ──────────────────────────────────────────────────────────
const FUTURE2_WHITE_IMAGES = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FIL3UP0XSzlz2PFbuzMDrh%2FIPPONGEAR_Future_2_Judogi_white_01sDoYyH5FVNgBF_JQb-17.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fs5hd2w0Vb4VzfpZ-89aVL%2FIPPONGEAR_Future_2_Judogi_white_02_1g6FJd.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbQ7oSm8BQ96ochAC5pqkp%2FIPPONGEAR_Future_2_Judogi_white_03qVqWEwRvyOzCn_EK0N8C.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fa6OstdL2ufcIegYPWlbLn%2FIPPONGEAR_Future_2_Judogi_white_04_SOmCdc.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FjsMDlh1b_NNEzI0HHipqA%2FIPPONGEAR_Future_2_Judogi_white_05_XrVyCM.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FUsxCVzwZKxw9tE1dCJ2At%2FIPPONGEAR_Future_2_Judogi_white_06_GE3TVo.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FFWaKMFEibYb4A65djPRbf%2FSize-chart-IG-Judoanzug-Future-2_(1)_c2jjRG.jpg",
];

// ─── FUTURE 2 Blue ───────────────────────────────────────────────────────────
const FUTURE2_BLUE_IMAGES = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FZdG8F8eLBtxRpXFIui6-F%2FIPPONGEAR_Future_2_Judogi_blue_01_-aDsxx.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fv--lwGGf7bwKdYQFA9ozo%2FIPPONGEAR_Future_2_Judogi_blue_03_0vcHNA.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F--MSKJ8Xq2xkzCrCB64s0%2FIPPONGEAR_Future_2_Judogi_blue_04_mv8Pxf.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FBrzycKeadeLb8Z9A-s9Cr%2FIPPONGEAR_Future_2_Judogi_blue_06_CV5g2g.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fod_TTcKzAPJehEL5P2wxx%2FIPPONGEAR_Future_2_Judogi_blue_07_Xhoin0.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FW0cYapkQ-tSsxgSSL8Lz2%2FIPPONGEAR_Future_2_Judogi_blue_08_t4IUYu.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FFWaKMFEibYb4A65djPRbf%2FSize-chart-IG-Judoanzug-Future-2_(1)_c2jjRG.jpg",
];

// ─── BASIC 2 White ───────────────────────────────────────────────────────────
const BASIC2_WHITE_IMAGES = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Frhq4xMtuHPElXDYeGUOdy%2FIPPONGEAR_Basic_2_Judogi_white_01_WrgBRL.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FhTIYKzAr3JBxdc-ecgj1K%2FIPPONGEAR_Basic_2_Judogi_white_02_PwRXCX.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fj3IY0HRaD8eb1DAfl66Dh%2FIPPONGEAR_Basic_2_Judogi_white_03_CpxWbk.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F3Z16qu-NKe7bTNQ14wHCU%2FIPPONGEAR_Basic_2_Judogi_white_04_iKoKSX.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FeTzwDTb16QV8NMpyRN_ZW%2FIPPONGEAR_Basic_2_Judogi_white_05_Xq76mW.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fqx0wCWOTt7kdTsZqQ_Wli%2FIPPONGEAR_Basic_2_Judogi_white_06_A1mT6t.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbbWlyQojemOvPI4XVCxnH%2FSize-chart-IG-Judoanzug-Basic-2_(1)_DjUpFt.jpg",
];

// ─── BASIC 2 Blue ────────────────────────────────────────────────────────────
const BASIC2_BLUE_IMAGES = [
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fns_6Z9Ro-sjFl5xlje5Ot%2FIPPONGEAR_Basic_2_Judogi_blue_01_zn9432.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fl1mJHLqFHP219TSVwBSrF%2FIPPONGEAR_Basic_2_Judogi_blue_02_cpSDO6.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FfwSJ3BmNBYSiz3xLM7Ubx%2FIPPONGEAR_Basic_2_Judogi_blue_03_Wm9646.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FduShVCH_mbPeSvXlPndDB%2FIPPONGEAR_Basic_2_Judogi_blue_04_M8ohKH.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FeXtmuD_4KzyYxgOc3kJqX%2FIPPONGEAR_Basic_2_Judogi_blue_05_lFF85T.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FAMM6CjoiiIFnAdp7lWxNz%2FIPPONGEAR_Basic_2_Judogi_blue_06_YmrZYs.jpg",
  "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FbbWlyQojemOvPI4XVCxnH%2FSize-chart-IG-Judoanzug-Basic-2_(1)_DjUpFt.jpg",
];

// ─── KINTAYO size charts ──────────────────────────────────────────────────────
const KINTAYO_CHART_JUDO = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2Fom9qeiTXFGh9DIiwTsYSY%2Fkintayo-size-chart-judo.png";
const KINTAYO_CHART_BJJ = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F9yVKjyPsLuBjUzS6-9YSZ%2Fkintayo-size-chart-bjj.png";
const KINTAYO_CHART_KARATE = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FaQnqOcDCeSH9oGup52Z0R%2Fkintayo-size-chart-karate.png";
const KINTAYO_CHART_SAMBO = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FL2GrQAS0DIfu2Y-jCwg9W%2Fkintayo-size-chart-sambo.png";
const KINTAYO_CHART_SAMBO_SHOES = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FgRcz_H8bb93z8bAWwRoM-%2Fkintayo-size-chart-sambo-shoes.png";
const KINTAYO_CHART_GRAPPLING = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F8kbfrsFBad95Lsn3mHbKV%2Fkintayo-size-chart-grappling.png";

// ─── BUDOGI size charts ───────────────────────────────────────────────────────
const BUDOGI_CHART_JUDO_BEGINNER = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FfD0gycC2kvGA785RsjWRb%2Fbudogi-size-chart-judo-beginner.png";
const BUDOGI_CHART_JUDO_ADVANCED = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2F5ONWe7cwQ9Q5KY8jtIF3P%2Fbudogi-size-chart-judo-advanced.png";
const BUDOGI_CHART_JUDO_PRO = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FdehNVQwuwyu0UPOnLRBvw%2Fbudogi-size-chart-judo-pro.png";
const BUDOGI_CHART_KARATE = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FW2Cv0N_3-g-Bh9Qj_u2Gs%2Fbudogi-size-chart-karate.png";
const BUDOGI_CHART_GRAPPLING = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FM0DuejTL3EULkVsGcixkx%2Fbudogi-size-chart-grappling.png";
const BUDOGI_CHART_BJJ = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FwZtV4WnST3tCa_ZxgWB5_%2Fbudogi-size-chart-bjj.png";
const IPPON_CHART_FUTURE_BEGINNER = "https://storage.googleapis.com/runable-templates/cli-uploads%2FHxnzh2CIjZWbUrO5fO4T2SQ43ZutJB5h%2FqPFDIGhtntAQa2vW0Ip2I%2Ffuture-pink-size-chart.jpg";

// Helper: append size chart(s) to existing YML images (chart-only override, keeps product photos from YML)
// Used when we only have new charts but NOT new product photos.
// The applyImageOverride function replaces images entirely, so for chart-append
// we use a special colorKeyword "" which matches everything as fallback via appendChart.
// Instead, we use a "chartOnly" flag pattern: images array = [CHART_URL] and a special wrapper.
// Simpler approach: store as normal override but include a marker so applyImageOverride
// can detect chart-only and merge with fallback. We'll use a dedicated function instead.

/**
 * appendChartOverride: like applyImageOverride but APPENDS charts to existing images
 * rather than replacing them. Used for brands where we have charts but no new product photos.
 */

// Offer IDs to exclude from the catalog entirely (raw YML offer id, not offerId).
// Use this to hide specific accidental/incorrect offers without touching YML parser.
// Format: Set<rawOfferId>
const EXCLUDED_OFFER_IDS = new Set<string>([
  // 110_2-45 moved to correct grey variant in catalog-snapshot.json
]);

// Per-product, per-color colorHex overrides.
// Key: groupId → map of color (YML param value) → hex.
// Use to correct swatch colors that look wrong with the global COLOR_HEX defaults.
const PRODUCT_COLOR_HEX_OVERRIDES: Record<string, Record<string, string>> = {
  // Product 1756 — KINTAYO JUDO cap (звичайна): "Синій" is actually navy/dark-blue in the YML photos
  "1756": { "Синій": "#1C3A6E" },
  // Product 1759 — KINTAYO JUDO cap (реперка з прямим козирком): same navy issue
  "1759": { "Синій": "#1C3A6E" },
};

// Per-product, per-color label rename overrides.
// Key: groupId → map of YML color param value → display label shown to user.
// Does NOT affect offer id, price, availability or photos.
const PRODUCT_COLOR_NAME_OVERRIDES: Record<string, Record<string, string>> = {
  // Product 1756 — KINTAYO JUDO cap (звичайна): dark navy labeled "Синій" in YML
  "1756": { "Синій": "Темно-синій" },
  // Product 1759 — KINTAYO JUDO cap (реперка з прямим козирком): same issue
  "1759": { "Синій": "Темно-синій" },
};

// Images to strip from YML feed output per groupId (e.g. old/duplicate size charts).
// Applied before chart appending in applyImageOverride.
const STRIP_IMAGES: Record<string, string[]> = {
  // sambo_size.jpg is the old Kintayo CDN chart — replaced by kintayo-size-chart-sambo.png
  "1040":       ["https://static.kintayo.com/images/sambo/kids/sambo_size.jpg"],
  "1040_adult": ["https://static.kintayo.com/images/sambo/kids/sambo_size.jpg"],
};

const CHART_ONLY_OVERRIDES: Record<string, string[]> = {
  // ── KINTAYO judo (Koka=216, Yuko=117/117_adult, Wazari=241/801) ──────────
  "216":       [KINTAYO_CHART_JUDO],
  "117":       [KINTAYO_CHART_JUDO],
  "241":       [KINTAYO_CHART_JUDO],
  "801":       [KINTAYO_CHART_JUDO],
  // ── KINTAYO BJJ (244=kids, 181=adults) ───────────────────────────────────
  "244":       [KINTAYO_CHART_BJJ],
  "181":       [KINTAYO_CHART_BJJ],
  // ── KINTAYO karate (261 / 261_adult) ─────────────────────────────────────
  "261":       [KINTAYO_CHART_KARATE],
  "261_adult": [KINTAYO_CHART_KARATE],
  // ── KINTAYO judo adult split variant ─────────────────────────────────────
  "117_adult": [KINTAYO_CHART_JUDO],
  // ── KINTAYO sambo (1040=форма kids, 1040_adult=форма adults, 1066=взуття) ──
  "1040":       [KINTAYO_CHART_SAMBO],
  "1040_adult": [KINTAYO_CHART_SAMBO],
  "1066":       [KINTAYO_CHART_SAMBO_SHOES],
  // ── KINTAYO grappling (1401=kids, 1405=adults) ────────────────────────────
  "1401":      [KINTAYO_CHART_GRAPPLING],
  "1405":      [KINTAYO_CHART_GRAPPLING],

  // ── BUDOGI дзюдо BEGINNER (1425=boys, 1436=girls) ────────────────────────
  "1425":      [BUDOGI_CHART_JUDO_BEGINNER],
  "1436":      [BUDOGI_CHART_JUDO_BEGINNER],
  // ── BUDOGI дзюдо ADVANCED (1446=men, 1458=women) ─────────────────────────
  "1446":      [BUDOGI_CHART_JUDO_ADVANCED],
  "1458":      [BUDOGI_CHART_JUDO_ADVANCED],
  // ── BUDOGI дзюдо PRO (1470=men, 1482=women) ──────────────────────────────
  "1470":      [BUDOGI_CHART_JUDO_PRO],
  "1482":      [BUDOGI_CHART_JUDO_PRO],
  // ── BUDOGI карате (240 г/м²) (1556=boys, 1561=girls, 1567=men, 1571=women) ─
  "1556":      [BUDOGI_CHART_KARATE],
  "1561":      [BUDOGI_CHART_KARATE],
  "1567":      [BUDOGI_CHART_KARATE],
  "1571":      [BUDOGI_CHART_KARATE],
  // ── BUDOGI грепплінг (1583=boys, 1587=girls, 1599=men, 1603=women) ────────
  "1583":      [BUDOGI_CHART_GRAPPLING],
  "1587":      [BUDOGI_CHART_GRAPPLING],
  "1599":      [BUDOGI_CHART_GRAPPLING],
  "1603":      [BUDOGI_CHART_GRAPPLING],
  // ── BUDOGI джиу-джитсу / BJJ gi (1500=boys, 1520=girls, 1524=men, 1540=women) ──
  "1500":      [BUDOGI_CHART_BJJ],
  "1520":      [BUDOGI_CHART_BJJ],
  "1524":      [BUDOGI_CHART_BJJ],
  "1540":      [BUDOGI_CHART_BJJ],
  // ── BUDOGI айкідо 350 г/м² → BEGINNER chart (1702=boys, 1707=girls, 1721=men, 1727=women) ─
  "1702":      [BUDOGI_CHART_JUDO_BEGINNER],
  "1707":      [BUDOGI_CHART_JUDO_BEGINNER],
  "1721":      [BUDOGI_CHART_JUDO_ADVANCED],
  "1727":      [BUDOGI_CHART_JUDO_ADVANCED],
  // ── BUDOGI айкідо 240 г/м² → KARATE chart (1692=boys, 1697=girls, 1712=men, 1716=women) ─
  "1692":      [BUDOGI_CHART_KARATE],
  "1697":      [BUDOGI_CHART_KARATE],
  "1712":      [BUDOGI_CHART_KARATE],
  "1716":      [BUDOGI_CHART_KARATE],
  // ── BUDOGI рукопашний бій 350 г/м² → BEGINNER chart (1660=boys, 1665=girls, 1679=men, 1686=women) ─
  "1660":      [BUDOGI_CHART_JUDO_BEGINNER],
  "1665":      [BUDOGI_CHART_JUDO_BEGINNER],
  "1679":      [BUDOGI_CHART_JUDO_ADVANCED],
  "1686":      [BUDOGI_CHART_JUDO_ADVANCED],
  // ── BUDOGI рукопашний бій 240 г/м² → KARATE chart (1607=boys, 1655=girls, 1671=men, 1675=women) ─
  "1607":      [BUDOGI_CHART_KARATE],
  "1655":      [BUDOGI_CHART_KARATE],
  "1671":      [BUDOGI_CHART_KARATE],
  "1675":      [BUDOGI_CHART_KARATE],

  // ── IPPON GEAR FUTURE 2.0 PINK (38) — keep YML pink photos, append Beginner/Future chart ─
  "38":        [IPPON_CHART_FUTURE_BEGINNER],
};

const IMAGE_OVERRIDES: Record<string, { colorKeyword: string; images: string[]; }[]> = {
  "1310": [{ colorKeyword: "білий", images: ULTRALIGHT_WHITE_IMAGES }],
  // ── ULTRALIGHT Regular (1321) — same charts as Slim ───────────────────────
  "1321": [{ colorKeyword: "білий", images: ULTRALIGHT_WHITE_IMAGES }],
  "2":    [
    { colorKeyword: "білий", images: BASIC2_WHITE_IMAGES },
    { colorKeyword: "синій", images: BASIC2_BLUE_IMAGES },
  ],
  "153":  [{ colorKeyword: "білий", images: NXT_BOYS_IMAGES }],
  "1309": [{ colorKeyword: "білий", images: NXT_RED_IMAGES }],
  "1332": [
    { colorKeyword: "білий", images: FUTURE2_WHITE_IMAGES },
    { colorKeyword: "синій", images: FUTURE2_BLUE_IMAGES },
  ],
  "366":  [
    { colorKeyword: "білий", images: IJF_WHITE_IMAGES_REGULAR },
    { colorKeyword: "синій", images: IJF_BLUE_IMAGES_REGULAR },
  ],
  "1198": [
    { colorKeyword: "білий", images: IJF_WHITE_IMAGES_WOMEN },
    { colorKeyword: "синій", images: IJF_BLUE_IMAGES_WOMEN },
  ],
  "1381": [
    { colorKeyword: "білий", images: IJF_WHITE_IMAGES_SLIM },
    { colorKeyword: "синій", images: IJF_BLUE_IMAGES_SLIM },
  ],
};

function applyImageOverride(groupId: string, color: string, fallback: string[]): string[] {
  // Full image-set override (replaces YML photos entirely)
  const rules = IMAGE_OVERRIDES[groupId];
  if (rules) {
    const rule = rules.find(r => color.toLowerCase().includes(r.colorKeyword.toLowerCase()));
    if (rule) return rule.images;
  }
  // Strip unwanted images (e.g. old duplicate size charts from YML)
  const stripList = STRIP_IMAGES[groupId];
  const base = stripList ? fallback.filter(img => !stripList.includes(img)) : fallback;
  // Chart-only override (appends size chart(s) to existing YML photos)
  const chartUrls = CHART_ONLY_OVERRIDES[groupId];
  if (chartUrls && base.length > 0) {
    return [...base, ...chartUrls];
  }
  return base;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
interface CacheEntry { products: Product[]; fetchedAt: number; }
let cache: CacheEntry | null = null;

function slugify(str: string): string {
  return str.toLowerCase().replace(/[іїєё]/g, (c) => ({ і: "i", ї: "yi", є: "ye", ё: "yo" }[c] ?? c)).replace(/[а-яґ]/g, transliterateUk).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
const UA_MAP: Record<string, string> = { а:"a", б:"b", в:"v", г:"h", д:"d", е:"e", ж:"zh", з:"z", и:"y", к:"k", л:"l", м:"m", н:"n", о:"o", п:"p", р:"r", с:"s", т:"t", у:"u", ф:"f", х:"kh", ц:"ts", ч:"ch", ш:"sh", щ:"shch", ь:"", ю:"yu", я:"ya", ґ:"g" };
function transliterateUk(c: string): string { return UA_MAP[c] ?? c; }
const COLOR_HEX: Record<string, string> = { Білий:"#FFFFFF", Біле:"#FFFFFF", Біла:"#FFFFFF", Синій:"#1B4FBF", Синє:"#1B4FBF", Синя:"#1B4FBF", "Темно-синій":"#1C3A6E", "Темно-синя":"#1C3A6E", "Темно-синє":"#1C3A6E", Чорний:"#1A1A1A", Чорне:"#1A1A1A", Червоний:"#E8232A", Червоне:"#E8232A", Жовтий:"#F5C518", Жовте:"#F5C518", Зелений:"#2D7A2D", Зелене:"#2D7A2D", Коричневий:"#8B4513", Фіолетовий:"#6B2FA0", Сірий:"#808080", Помаранчевий:"#FF8C00", Помаранчеве:"#FF8C00", Бежевий:"#C8A97A", Бежева:"#C8A97A", Бежеве:"#C8A97A" };
function colorHex(color: string): string { for (const [key, hex] of Object.entries(COLOR_HEX)) if (color.toLowerCase().includes(key.toLowerCase())) return hex; return "#888888"; }

// ── Belt color normalization ──────────────────────────────────────────────────
// Canonical Ukrainian color names for belt swatches
const BELT_COLOR_ALIASES: [RegExp, string][] = [
  [/^(white|білий|біла|біле)$/i,                                    'Білий'],
  [/^(white[\s-]yellow|біло[\s-]жовтий|білий[\s-]жовтий)$/i,       'Біло-жовтий'],
  [/^(yellow|жовтий|жовта|жовте)$/i,                                'Жовтий'],
  [/^(yellow[\s-]orange|жовто[\s-]помаранчевий|жовто[\s-]оранжевий)$/i, 'Жовто-помаранчевий'],
  [/^(orange|помаранчевий|помаранчева|оранжевий|оранжева)$/i,       'Помаранчевий'],
  [/^(orange[\s-]green|помаранчево[\s-]зелений|поморанчево[\s-]зелений|помаранчево[\s-]зелена|оранжево[\s-]зелений)$/i, 'Помаранчево-зелений'],
  [/^(green|зелений|зелена|зелене)$/i,                              'Зелений'],
  [/^(blue|синій|синя|синє)$/i,                                     'Синій'],
  [/^(brown|коричневий|коричнева)$/i,                               'Коричневий'],
  [/^(black|чорний|чорна|чорне)$/i,                                 'Чорний'],
  // ── BJJ belt aliases ───────────────────────────────────────────────────────
  // Fix Latin "C" typo: "Cіро-чорний" → "Сіро-чорний"
  [/^[СC]ірий$/i,                                                   'Сірий'],
  [/^[СC]іро[\s-]чорний$/i,                                         'Сіро-чорний'],
  [/^[СC]іро[\s-]білий$/i,                                          'Біло-сірий'],   // normalize "Сіро-білий" → canonical "Біло-сірий"
  [/^біло[\s-]сірий$/i,                                             'Біло-сірий'],
  [/^жовто[\s-]білий$/i,                                            'Біло-жовтий'],  // "Жовто-білий" → canonical "Біло-жовтий"
  [/^жовто[\s-]чорний$/i,                                           'Жовто-чорний'],
  [/^помаранчево[\s-]білий$/i,                                      'Біло-помаранчевий'],
  [/^помаранчево[\s-]чорний$/i,                                     'Помаранчево-чорний'],
  [/^зелено[\s-]білий$/i,                                           'Біло-зелений'],
  [/^зелено[\s-]чорний$/i,                                          'Зелено-чорний'],
  [/^біло[\s-]зелений$/i,                                           'Біло-зелений'],
  [/^біло[\s-]помаранчевий$/i,                                      'Біло-помаранчевий'],
  [/^фіолетовий$/i,                                                  'Фіолетовий'],
];

function normalizeBeltColor(raw: string): string {
  const t = raw.trim();
  for (const [re, canonical] of BELT_COLOR_ALIASES) {
    if (re.test(t)) return canonical;
  }
  return t; // unknown — keep as is
}

// Hex values for individual belt colors (used to build gradients)
const BELT_SOLID_HEX: Record<string, string> = {
  'Білий':              '#FFFFFF',
  'Сірий':              '#808080',
  'Жовтий':             '#F5C518',
  'Помаранчевий':       '#FF8C00',
  'Зелений':            '#2D7A2D',
  'Синій':              '#1B4FBF',
  'Коричневий':         '#8B4513',
  'Чорний':             '#1A1A1A',
  'Фіолетовий':         '#6B2FA0',
};

// Gradient definitions for dual-color belt swatches
const BELT_COMBO_GRADIENT: Record<string, { hex: string; gradient: string }> = {
  // Judo combos
  'Біло-жовтий':           { hex: '#F5C518', gradient: 'linear-gradient(135deg, #FFFFFF 50%, #F5C518 50%)' },
  'Жовто-помаранчевий':    { hex: '#FF8C00', gradient: 'linear-gradient(135deg, #F5C518 50%, #FF8C00 50%)' },
  'Помаранчево-зелений':   { hex: '#FF8C00', gradient: 'linear-gradient(135deg, #FF8C00 50%, #2D7A2D 50%)' },
  // BJJ combos
  'Біло-сірий':            { hex: '#808080', gradient: 'linear-gradient(135deg, #FFFFFF 50%, #808080 50%)' },
  'Сіро-чорний':           { hex: '#808080', gradient: 'linear-gradient(135deg, #808080 50%, #1A1A1A 50%)' },
  'Жовто-чорний':          { hex: '#F5C518', gradient: 'linear-gradient(135deg, #F5C518 50%, #1A1A1A 50%)' },
  'Біло-помаранчевий':     { hex: '#FF8C00', gradient: 'linear-gradient(135deg, #FFFFFF 50%, #FF8C00 50%)' },
  'Помаранчево-чорний':    { hex: '#FF8C00', gradient: 'linear-gradient(135deg, #FF8C00 50%, #1A1A1A 50%)' },
  'Біло-зелений':          { hex: '#2D7A2D', gradient: 'linear-gradient(135deg, #FFFFFF 50%, #2D7A2D 50%)' },
  'Зелено-чорний':         { hex: '#2D7A2D', gradient: 'linear-gradient(135deg, #2D7A2D 50%, #1A1A1A 50%)' },
};

function beltColorVisual(canonical: string): { hex: string; gradient?: string } {
  if (BELT_COMBO_GRADIENT[canonical]) return BELT_COMBO_GRADIENT[canonical];
  if (BELT_SOLID_HEX[canonical]) return { hex: BELT_SOLID_HEX[canonical] };
  return { hex: colorHex(canonical) };
}

// YUKO series: children belt colors (white through orange-green)
const YUKO_COLORS_ORDER = ['Білий', 'Біло-жовтий', 'Жовтий', 'Жовто-помаранчевий', 'Помаранчевий', 'Помаранчево-зелений'];
// WAZARI series: advanced belt colors
const WAZARI_COLORS_ORDER = ['Зелений', 'Синій', 'Коричневий'];

/** Detect which KINTAYO belt series a product belongs to based on its name or colors.
 *  Priority: explicit name keyword → fallback by isChildren flag.
 *  YUKO = beginner (white→orange-green), children products.
 *  WAZARI = advanced (green→brown), adult products.
 */
function detectKintayoBeltSeries(name: string, isChildrenProduct: boolean): 'YUKO' | 'WAZARI' {
  const upper = name.toUpperCase();
  if (upper.includes('YUKO') || upper.includes('ЮКО')) return 'YUKO';
  if (upper.includes('WAZARI') || upper.includes('ВАЗАРІ')) return 'WAZARI';
  // Fallback: children → YUKO, adults → WAZARI
  return isChildrenProduct ? 'YUKO' : 'WAZARI';
}

/** Sort and filter belt variants for KINTAYO YUKO/WAZARI series.
 *  - Normalizes color names
 *  - Filters only allowed colors for the series
 *  - Sorts in canonical order
 *  - Sets colorHex and colorGradient correctly
 */
function applyKintayoBeltColorLogic(
  variants: ProductVariant[],
  series: 'YUKO' | 'WAZARI',
): ProductVariant[] {
  const orderList = series === 'YUKO' ? YUKO_COLORS_ORDER : WAZARI_COLORS_ORDER;
  const orderSet = new Set(orderList);

  const result: ProductVariant[] = [];
  for (const v of variants) {
    const normalized = normalizeBeltColor(v.color);
    if (!orderSet.has(normalized)) continue; // filter out colors not in this series
    const visual = beltColorVisual(normalized);
    result.push({
      ...v,
      color: normalized,
      colorHex: visual.hex,
      colorGradient: visual.gradient,
    });
  }

  // Sort by series order, deduplicate by canonical color name
  const seen = new Set<string>();
  const sorted: ProductVariant[] = [];
  for (const canon of orderList) {
    const match = result.find(v => v.color === canon);
    if (match && !seen.has(canon)) {
      seen.add(canon);
      sorted.push(match);
    }
  }
  return sorted;
}

/**
 * Parse комплектація (what's in the box) from raw YML HTML description.
 * Must be called BEFORE stripping HTML tags.
 *
 * YML structure: each property is an <li> item, e.g.:
 *   <li>В комплекті: куртка, штани, білий пояс</li>
 *   <li>Синій пояс та рюкзак-мішок в подарунок</li>
 *
 * Patterns handled:
 *   "В комплекті: куртка, штани, білий пояс"   → beltStatus: 'included'
 *   "В комплекті: куртка, штани"                → beltStatus: null
 *   "Синій пояс та рюкзак-мішок в подарунок"   → beltStatus: 'gift'
 *   No комплект info                            → includes: [], beltStatus: null
 */
function parseIncludesFromHTML(rawHtml: string): { includes: string[]; beltStatus: Product['beltStatus'] } {
  // ── 1. Parse "В комплекті: ..." directly from HTML before tag-stripping ───
  // The <li> boundary ensures we only get items on that line, not the whole description.
  const komplektLiMatch = rawHtml.match(/В\s+комплект[іи][:\s]+([^<]+)/i);
  const baseItems: string[] = [];
  if (komplektLiMatch) {
    const raw = komplektLiMatch[1];
    const items = raw.split(/,\s*/).map(s => {
      // Decode basic HTML entities, strip whitespace, strip trailing dot
      let t = s.replace(/&nbsp;/gi, ' ').replace(/&[a-z]+;|&#\d+;/gi, '').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
      // Strip leading Ukrainian/Russian conjunctions: "та", "і", "й" (e.g. "та пояс" → "пояс")
      t = t.replace(/^(та|і|й)\s+/i, '');
      if (t.length < 3) return '';
      // Reject items that start with a digit (e.g. "5 см" from split on "4,5 см")
      if (/^\d/.test(t)) return '';
      // Reject items that start with a lowercase function word with no noun (e.g. "резинкою 4")
      // Heuristic: valid включено items start with a noun (Куртка, Штани, Пояс, Шорти, Рюкзак...)
      // Keep only if: starts with uppercase after capitalize OR is a known word
      // Simple approach: reject if it looks like a number fragment ("4") or unit
      if (t.length > 60) return '';
      return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    }).filter(s => s.length > 2);
    // Heuristic: if more than 4 items, it's probably a narrative sentence split, not a clean list
    // Only keep first 4 items and validate they look like clothing/gear items
    const cleanItems = items.filter(item => {
      // Valid items are short nouns: Куртка, Штани, Пояс, Рюкзак, Шорти, Взуття, etc.
      // Reject items that contain lowercase prepositions suggesting mid-sentence fragments
      return !/^(резинк|посилен|повністю|застібк|кишен|манжет|шнурк|еластич|бічн)/i.test(item);
    });
    baseItems.push(...cleanItems);
  }

  // ── 2. Detect gift belt pattern ───────────────────────────────────────────
  // Pattern in <li>: "Синій пояс та рюкзак-мішок в подарунок"
  const giftLiMatch = rawHtml.match(/([А-ЯІЇЄ][а-яіїєґ']+\s+пояс(?:\s+та\s+[^<]+?)?)\s+(?:у|в)\s+подарунок/i);
  if (giftLiMatch) {
    const giftItemsRaw = giftLiMatch[1].split(/\s+та\s+/i);
    const giftLabels = giftItemsRaw.map(s => {
      const t = s.replace(/&nbsp;/gi, ' ').replace(/&[a-z]+;|&#\d+;/gi, '').replace(/\s+/g, ' ').trim();
      return `${t.charAt(0).toUpperCase() + t.slice(1)} — у подарунок`;
    });
    // Remove belt from baseItems (it's covered by the gift label)
    const filteredBase = baseItems.filter(item => !/пояс/i.test(item));
    return {
      includes: [...filteredBase, ...giftLabels],
      beltStatus: 'gift',
    };
  }

  if (baseItems.length > 0) {
    // Check if білий пояс is in the комплект list
    // Simple substring check — \b doesn't work for Cyrillic in JS regex
    const hasBelt = baseItems.some(item => /білий\s+пояс/i.test(item) && !/еластич/i.test(item));
    return {
      includes: baseItems,
      beltStatus: hasBelt ? 'included' : null,
    };
  }

  // No комплект info found
  return { includes: [], beltStatus: null };
}

interface RawOffer { id:string; groupId:string; available:boolean; price:number; oldPrice?:number; name:string; description:string; /** Raw HTML of description (CDATA unwrapped, tags preserved) for комплектація parsing */ rawDescriptionHTML:string; categoryId:string; vendor:string; vendorCode:string; pictures:string[]; params:Record<string,string>; url?:string; }
function parseXML(xml: string): { categories: Map<string, { name: string; parentId?: string }>; offers: RawOffer[] } {
  const categories = new Map<string, { name: string; parentId?: string }>();
  const catRegex = /<category\s+([^>]*)>([\s\S]*?)<\/category>/g; let m: RegExpExecArray | null;
  while ((m = catRegex.exec(xml)) !== null) { const attrs = m[1]; const text = m[2].trim(); const idMatch = attrs.match(/\bid="([^"]*)"/); const parentMatch = attrs.match(/\bparentId="([^"]*)"/); if (idMatch) categories.set(idMatch[1], { name: text, parentId: parentMatch?.[1] }); }
  const offers: RawOffer[] = []; const offerBlockRegex = /<offer\s([^>]*)>([\s\S]*?)<\/offer>/g;
  while ((m = offerBlockRegex.exec(xml)) !== null) {
    const attrs = m[1]; const body = m[2]; const id = attrs.match(/\bid="([^"]*)"/)?.[1] ?? ""; const groupId = attrs.match(/\bgroup_id="([^"]*)"/)?.[1] ?? id; const available = attrs.match(/\bavailable="([^"]*)"/)?.[1] !== "false";
    const getText = (tag: string) => { const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"); const t = body.match(r)?.[1] ?? ""; return t.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim(); };
    // getRawHTML: unwrap CDATA but keep HTML tags (for комплектація parsing)
    const getRawHTML = (tag: string) => { const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"); const t = body.match(r)?.[1] ?? ""; return t.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim(); };
    const pictures: string[] = []; const picRegex = /<picture[^>]*>([\s\S]*?)<\/picture>/g; let pm: RegExpExecArray | null; while ((pm = picRegex.exec(body)) !== null) pictures.push(pm[1].trim());
    const params: Record<string, string> = {}; const paramRegex = /<param\s+name="([^"]*)"[^>]*>([\s\S]*?)<\/param>/g; let par: RegExpExecArray | null; while ((par = paramRegex.exec(body)) !== null) params[par[1]] = par[2].trim();
    const oldPriceStr = getText("oldprice") || getText("old_price");
    offers.push({ id, groupId, available, price: parseFloat(getText("price")) || 0, oldPrice: oldPriceStr ? parseFloat(oldPriceStr) : undefined, name: getText("name"), description: getText("description"), rawDescriptionHTML: getRawHTML("description"), categoryId: getText("categoryId"), vendor: getText("vendor"), vendorCode: getText("vendorCode") || getText("article"), pictures, params, url: getText("url") });
  }
  return { categories, offers };
}
function getCategoryPath(catId: string, categories: Map<string, { name: string; parentId?: string }>): string[] { const path: string[] = []; const visited = new Set<string>(); let current = catId; while (current && categories.has(current) && !visited.has(current)) { visited.add(current); const cat = categories.get(current)!; path.unshift(cat.name); current = cat.parentId ?? ""; } return path; }
function normalizeBrand(raw: string): string {
  const up = raw.trim().toUpperCase();
  if (/^TM\s+KINTAYO$|^KINTAYO$/.test(up)) return 'KINTAYO';
  // preserve exact casing for known brands, pass others through as-is
  return raw.trim();
}
function getBrand(rep: RawOffer): string {
  const raw = rep.vendor || rep.params["Бренд"] || rep.params["Brand"] || "Unknown";
  return normalizeBrand(raw);
}
function getSize(o: RawOffer): string { return o.params["Зріст"] || o.params["Розмір"] || o.params["Довжина"] || o.params["Довжина пояса"] || ""; }

/** Extract bag/backpack/luggage size from params or product name.
 *  Returns normalized strings like "M", "XL", "40 л", "50×30×25 см" or "".
 */
function getBagSize(name: string, params: Record<string, string>): string {
  // 1. Explicit params
  const rawSize = params["Розмір"] || params["Об'єм"] || params["Об'єм сумки"] || params["Volume"] || "";
  if (rawSize) return normalizeBagSizeStr(rawSize);

  // 2. Volume in litres from any param
  for (const v of Object.values(params)) {
    const litres = extractLitres(v);
    if (litres) return litres;
  }

  // 3. Extract from name: "ESSENTIAL M", "FIGHTER 2", "TRAVELLER WHEEL XL"
  const nameSize = extractSizeFromName(name);
  if (nameSize) return nameSize;

  return "";
}

function normalizeBagSizeStr(raw: string): string {
  const t = raw.trim();
  // Litres: "30л", "30 л.", "30L", "30 L"
  const litres = extractLitres(t);
  if (litres) return litres;
  // Dimensions: "50x30x25", "50×30×25 см"
  const dimMatch = t.match(/(\d{2,3})\s*[x×]\s*(\d{2,3})\s*[x×]\s*(\d{2,3})/i);
  if (dimMatch) return `${dimMatch[1]}×${dimMatch[2]}×${dimMatch[3]} см`;
  // T-shirt sizes
  const sizeMap: Record<string, string> = {
    'xxl': 'XXL', 'xl': 'XL', 'x-large': 'XL', 'large': 'L',
    'medium': 'M', 'small': 'S', 'xs': 'XS',
  };
  const lower = t.toLowerCase();
  for (const [k, v] of Object.entries(sizeMap)) {
    if (lower === k) return v;
  }
  // Already uppercase letter sizes: M, L, XL, XXL, S
  if (/^(XS|S|M|L|XL|XXL|XXXL)$/i.test(t)) return t.toUpperCase();
  return t;
}

function extractLitres(s: string): string {
  const m = s.match(/(\d+)\s*[лl]\.?(?:\s|$)/i);
  return m ? `${m[1]} л` : "";
}

function extractSizeFromName(name: string): string {
  // Match size suffix like "ESSENTIAL M", "TRAVELLER WHEEL XL", "BAG 90L"
  const litres = extractLitres(name);
  if (litres) return litres;
  // Trailing standard size letter(s): e.g. "... M", "... XL"
  const m = name.match(/\b(XXL|XL|X-LARGE|LARGE|MEDIUM|SMALL|XS)\b/i);
  if (m) return normalizeBagSizeStr(m[1]);
  // Single trailing M/L/S at end of name (e.g. "ESSENTIAL M")
  const m2 = name.match(/\s([MSL])(?:\s+\S{0,3})?$/i);
  if (m2) return m2[1].toUpperCase();
  return "";
}
function getColor(groupOffers: RawOffer[]): string { return groupOffers.map((o) => o.params["Колір"] || "").find(Boolean) || ""; }
function getAvailability(offer: RawOffer): boolean { const qty = Number(offer.params["quantity_in_stock"] || offer.params["quantity"] || 0); if (offer.params["in_stock"] === "false") return false; if (offer.params["in_stock"] === "true") return true; return offer.available || qty > 0; }

// Full belt color progression order for sorting swatches
const BELT_COLOR_PROGRESSION = [
  'Білий', 'Біло-жовтий', 'Жовтий', 'Жовто-помаранчевий',
  'Помаранчевий', 'Помаранчево-зелений', 'Зелений', 'Синій', 'Коричневий', 'Чорний',
];

// ── BJJ belt color order (IBJJF juvenile + adult) ────────────────────────────
// White → grey combos → yellow combos → orange combos → green combos → adult
const BJJ_BELT_COLORS_ORDER = [
  'Білий',
  'Біло-сірий',
  'Сірий',
  'Сіро-чорний',
  'Біло-жовтий',
  'Жовтий',
  'Жовто-чорний',
  'Біло-помаранчевий',
  'Помаранчевий',
  'Помаранчево-чорний',
  'Біло-зелений',
  'Зелений',
  'Зелено-чорний',
  'Синій',
  'Фіолетовий',
  'Коричневий',
  'Чорний',
];

/** Sort and normalize belt variants for BJJ belts (group 291 KINTAYO BJJ etc.)
 * - Normalize color names (including Latin-C typo fix in Cіро-чорний)
 * - Apply BJJ-specific IBJJF juvenile color order
 * - Apply combo gradients for dual-color belts
 */
function applyBjjBeltColorLogic(variants: ProductVariant[]): ProductVariant[] {
  const normalized = variants.map(v => {
    const canon = normalizeBeltColor(v.color);
    const visual = beltColorVisual(canon);
    return { ...v, color: canon, colorHex: visual.hex, colorGradient: visual.gradient };
  });
  const orderIndex = (color: string) => {
    const idx = BJJ_BELT_COLORS_ORDER.indexOf(color);
    return idx === -1 ? 999 : idx;
  };
  const seen = new Set<string>();
  const deduped: ProductVariant[] = [];
  for (const v of normalized) {
    if (!seen.has(v.color)) { seen.add(v.color); deduped.push(v); }
  }
  return deduped.sort((a, b) => orderIndex(a.color) - orderIndex(b.color));
}

/** Sort and normalize belt variants for non-KINTAYO belts.
 * - Normalize color names using normalizeBeltColor
 * - Apply correct colorHex / colorGradient visuals
 * - Sort in belt progression order
 * - Keep only colors that are actually present
 */
function applyBeltColorLogic(variants: ProductVariant[]): ProductVariant[] {
  const normalized = variants.map(v => {
    const canon = normalizeBeltColor(v.color);
    const visual = beltColorVisual(canon);
    return { ...v, color: canon, colorHex: visual.hex, colorGradient: visual.gradient };
  });
  // Sort by belt progression, unknown colors go last
  const orderIndex = (color: string) => {
    const idx = BELT_COLOR_PROGRESSION.indexOf(color);
    return idx === -1 ? 999 : idx;
  };
  // Deduplicate by canonical color — keep first occurrence per color
  const seen = new Set<string>();
  const deduped: ProductVariant[] = [];
  for (const v of normalized) {
    if (!seen.has(v.color)) { seen.add(v.color); deduped.push(v); }
  }
  return deduped.sort((a, b) => orderIndex(a.color) - orderIndex(b.color));
}

function sortSizes(offers: RawOffer[]): RawOffer[] {
  return [...offers].sort((a, b) => {
    const sa = getSize(a), sb = getSize(b);
    const na = parseFloat(sa), nb = parseFloat(sb);
    return isNaN(na) || isNaN(nb) ? sa.localeCompare(sb) : na - nb;
  });
}

/**
 * detectJudoLevel — assigns audience/level classification for judo kimono.
 * Based on brand + model name, NOT on size ranges.
 *
 * Rules (evaluated in order):
 *  professional → LEGEND 2 IJF (certified) + ULTRALIGHT (pro positioning, NOT IJF approved)
 *  children     → NXT, FUTURE 2, FUTURE 2.0, Koka, BEGINNER (isChildren=true models)
 *  teens_adults → BASIC 2, ADVANCED, PRO, Wazari, Yuko (adult), and default adult
 *
 * Only meaningful for judo kimono; returns undefined for everything else.
 */
function detectJudoLevel(
  brand: string,
  name: string,
  sportSlug: string,
  productType: string,
  entryIsChildren: boolean,
): Product['judoLevel'] {
  if (sportSlug !== 'judo' || productType !== 'kimono') return undefined;
  const n = name.toUpperCase();
  // Professional: LEGEND 2 IJF (certified) + ULTRALIGHT (pro-level, NOT IJF approved)
  if (n.includes('LEGEND 2') || n.includes('ULTRALIGHT')) return 'professional';
  // Children / juniors (model-based, not size-based)
  if (n.includes('NXT') || n.includes('FUTURE 2') || n.includes('FUTURE 2.0') || n.includes('KOKA') || n.includes('BEGINNER')) return 'children';
  if (entryIsChildren && (n.includes('YUKO') || n.includes('KOKA'))) return 'children';
  // Default: children=true → children, else teens_adults
  return entryIsChildren ? 'children' : 'teens_adults';
}

/**
 * detectModelSeries — extracts a clean, normalized series/model name from brand + product name.
 * Used to power the "Серія / модель" filter in CategoryPage.
 *
 * Rules evaluated in order per brand. Returns undefined when no meaningful series applies
 * (e.g. generic BUDOGI kimono without explicit series designation).
 */
function detectModelSeries(brand: string, name: string): string | undefined {
  const n = name.toUpperCase();
  const b = brand.toUpperCase();

  // ── IPPON GEAR ────────────────────────────────────────────────────────────
  if (b.includes('IPPON')) {
    if (n.includes('LEGEND 2') && n.includes('WOMEN'))    return 'Legend 2 IJF Women';
    if (n.includes('LEGEND 2') && (n.includes('SLIM')))   return 'Legend 2 IJF Slim';
    if (n.includes('LEGEND 2'))                            return 'Legend 2 IJF';
    if (n.includes('ULTRALIGHT') && n.includes('SLIM'))   return 'ULTRALIGHT Slim Fit';
    if (n.includes('ULTRALIGHT'))                          return 'ULTRALIGHT';
    if (n.includes('BASIC 2'))                             return 'BASIC 2';
    if (n.includes('NXT') && n.includes('RED'))            return 'NXT Red';
    if (n.includes('NXT'))                                 return 'NXT';
    if (n.includes('FUTURE 2') && n.includes('PINK'))      return 'Future 2 Pink';
    if (n.includes('FUTURE 2') || n.includes('FUTURE 2.0')) return 'Future 2';
    return undefined;
  }

  // ── BUDOGI ────────────────────────────────────────────────────────────────
  if (b.includes('BUDOGI')) {
    if (n.includes('BEGINNER'))  return 'BEGINNER';
    if (n.includes('ADVANCED'))  return 'ADVANCED';
    if (n.includes('PRO'))       return 'PRO';
    // Generic BUDOGI without series keyword — skip (not meaningful for filter)
    return undefined;
  }

  // ── KINTAYO ───────────────────────────────────────────────────────────────
  if (b.includes('KINTAYO')) {
    if (n.includes('WAZARI')) return 'Wazari';
    if (n.includes('YUKO'))   return 'Yuko';
    if (n.includes('KOKA'))   return 'Koka';
    return undefined;
  }

  return undefined;
}

function buildProducts(categories: Map<string, { name: string; parentId?: string }>, offers: RawOffer[]): Product[] {
  const groups = new Map<string, RawOffer[]>();
  for (const offer of offers) {
    if (!groups.has(offer.groupId)) groups.set(offer.groupId, []);
    groups.get(offer.groupId)!.push(offer);
  }
  const products: Product[] = [];

  for (const [groupId, groupOffersRaw] of groups) {
    if (!groupOffersRaw.length) continue;
    // Filter out excluded offers before processing
    const groupOffers = EXCLUDED_OFFER_IDS.size > 0
      ? groupOffersRaw.filter(o => !EXCLUDED_OFFER_IDS.has(o.id))
      : groupOffersRaw;
    if (!groupOffers.length) continue;
    const rep = groupOffers[0];
    const catPath = getCategoryPath(rep.categoryId, categories);
    // Build text for sport/children detection — EXCLUDE description to avoid
    // false positives like "підходить також для айкідо" in marketing copy.
    // Pass name first (highest priority), then params, then category path.
    const fullText = [rep.name, rep.vendor, ...Object.values(rep.params), ...catPath].join(" |");
    // detectSportSlug: name takes priority over everything else
    // Detect productType FIRST — bags/trainers override sport categorization
    const productType = detectProductType(rep.name, rep.vendor, catPath.join(' '), rep.description);
    // These product types are never "children" for category routing purposes — they span all ages.
    const NEVER_CHILDREN_TYPES = new Set(['belts', 'footwear', 'uniform', 'sauna_suit', 'tshirts']);
    // IPPON GEAR adult/professional models: their YML ageGroup includes "дитячі;підліткові;дорослі"
    // which triggers false-positive isChildren detection. Override: always adult.
    const ADULT_MODEL_FRAGMENTS = ['ULTRALIGHT', 'BASIC 2', 'LEGEND 2'];
    const isAdultModel = getBrand(rep).toUpperCase().includes('IPPON GEAR') &&
      ADULT_MODEL_FRAGMENTS.some(f => rep.name.toUpperCase().includes(f.toUpperCase()));
    const isChildren = (NEVER_CHILDREN_TYPES.has(productType) || isAdultModel)
      ? false
      : detectIsChildren(fullText);
    // Bags and trainers are accessories — never assign them to a sport category
    const NON_SPORT_TYPES = new Set(['bags', 'trainers']);
    const rawSportSlug = NON_SPORT_TYPES.has(productType)
      ? ('uncategorized' as const)
      : detectSportSlug(rep.name, ...catPath, ...Object.values(rep.params));
    const sportSlug = rawSportSlug;
    const categorySlug = NON_SPORT_TYPES.has(productType)
      ? 'uncategorized'
      : normalizeCategorySlugByMeta(sportSlug, isChildren);

    // Global sizes across all colors (for fallback)
    const sizeSet = new Set<string>();
    for (const o of groupOffers) { const s = getSize(o); if (s) sizeSet.add(s); }
    // For bags: supplement with bag-specific size (from name/params) if no standard sizes
    if (productType === 'bags') {
      const bagSz = getBagSize(rep.name, rep.params);
      if (bagSz) sizeSet.add(bagSz);
    }
    const sizes = Array.from(sizeSet).filter(Boolean).sort((a, b) => { const na = parseFloat(a), nb = parseFloat(b); return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb; });

    const color = getColor(groupOffers);
    const rawAllImages = Array.from(new Set(groupOffers.flatMap((o) => o.pictures))).slice(0, 8);
    // Apply image override for the primary color (used in "no-split" products where only one color exists)
    const allImages = applyImageOverride(groupId, color, rawAllImages);

    // ── Per-size image index: size → first picture from an offer of that size ──
    // Used later to pick correct representative image for child vs adult entries.
    const sizeImageMap = new Map<string, string[]>();
    for (const o of groupOffers) {
      const sz = getSize(o);
      if (sz && o.pictures.length > 0 && !sizeImageMap.has(sz)) {
        sizeImageMap.set(sz, o.pictures);
      }
    }

    // Group by color
    const colorMap = new Map<string, RawOffer[]>();
    for (const o of groupOffers) {
      const c = o.params["Колір"] || "Стандарт";
      if (!colorMap.has(c)) colorMap.set(c, []);
      colorMap.get(c)!.push(o);
    }

    // Build rich variants
    const rawVariants: ProductVariant[] = Array.from(colorMap.entries()).map(([c, colOffers]) => {
      const sorted = sortSizes(colOffers);
      const firstOffer = sorted[0];
      const colPrices = sorted.map(o => o.price).filter(p => p > 0);
      const colOldPrices = sorted.map(o => o.oldPrice).filter((p): p is number => p != null && p > 0);

      const offerEntries: OfferEntry[] = sorted.map(o => ({
        offerId: o.id,
        size: getSize(o),
        price: o.price,
        oldPrice: o.oldPrice,
        name: o.name,
        vendorCode: o.vendorCode,
        available: getAvailability(o),
      }));

      const rawColorImages = Array.from(new Set(sorted.flatMap((o) => o.pictures))).slice(0, 8);
      const resolvedColor = PRODUCT_COLOR_NAME_OVERRIDES[groupId]?.[c] ?? c;
      const resolvedColorHex = PRODUCT_COLOR_HEX_OVERRIDES[groupId]?.[c] ?? colorHex(resolvedColor);
      return {
        color: resolvedColor,
        colorHex: resolvedColorHex,
        images: applyImageOverride(groupId, c, rawColorImages),
        name: firstOffer.name,
        price: colPrices.length ? Math.min(...colPrices) : undefined,
        oldPrice: colOldPrices.length ? Math.min(...colOldPrices) : undefined,
        vendorCode: firstOffer.vendorCode,
        offers: offerEntries,
      };
    });

    // ── KINTAYO belt color normalization is applied per-entry (after split) ──
    // Only applies to KINTAYO judo belts (YUKO/WAZARI series).
    const isKintayoBelt = productType === 'belts'
      && getBrand(rep).toLowerCase().includes('kintayo')
      && (sportSlug === 'judo'
          || rep.name.toUpperCase().includes('YUKO')
          || rep.name.toUpperCase().includes('WAZARI')
          || rep.name.toUpperCase().includes('ЮКО')
          || rep.name.toUpperCase().includes('ВАЗАРІ'));
    // BJJ belts get their own IBJJF juvenile color order
    const isBjjBelt = productType === 'belts' && (sportSlug === 'bjj' || sportSlug === 'grappling');
    // For BUDOGI / IPPON GEAR / any non-KINTAYO non-BJJ belt: normalize colors + sort in belt progression order
    const isNonKintayoBelt = productType === 'belts' && !isKintayoBelt && !isBjjBelt;
    const variants: ProductVariant[] = isBjjBelt
      ? applyBjjBeltColorLogic(rawVariants)
      : isNonKintayoBelt
        ? applyBeltColorLogic(rawVariants)
        : rawVariants;

    // Group-level price = min across all offers
    const price = Math.min(...groupOffers.map((o) => o.price).filter((p) => p > 0));
    const oldPrices = groupOffers.map((o) => o.oldPrice).filter((p): p is number => p != null && p > 0);
    const oldPrice = oldPrices.length ? Math.min(...oldPrices) : undefined;

    const density = rep.params["Густина"] || "";
    const material = rep.params["Матеріал"] || "";
    const ageGroup = isChildren ? (rep.params["Вікова категорія"] || "Дитячі") : (rep.params["Вікова категорія"] || "");
    const sport = [rep.params["Призначення"], rep.params["Вид спорту"], catPath.slice(1, 2).join(""), getSportLabel(sportSlug)].filter(Boolean)[0] || "";
    const slug = `${slugify(getBrand(rep))}-${slugify(rep.name)}-${groupId}`.slice(0, 80);

    // ── Split child/adult when a "children" product has adult sizes (≥160) ────────
    // E.g. KINTAYO karate kimono has sizes 110–190 but isChildren=true.
    // We split into: child entry (sizes ≤155) + adult entry (sizes ≥160).
    const ADULT_SIZE_MIN = 160;
    // Only consider pure-numeric sizes (e.g. "160", "170") — not belt lengths like "220 см"
    const isPureNumeric = (s: string) => /^\d+$/.test(s.trim());

    // ── Per-model override: no adult split — size 160 stays in children group ──
    // Add groupId OR name substring to suppress child/adult split for specific models.
    const NO_ADULT_SPLIT: Array<{ groupId?: string; nameContains?: string }> = [
      // IPPON GEAR junior/youth models — 160 is the largest children size, not a separate adult group
      { nameContains: "IPPON GEAR FUTURE 2" },
      { nameContains: "IPPON GEAR FUTURE 2.0" },
      { nameContains: "IPPON GEAR NXT" },   // NXT boys & NXT Red girls — 160 is part of youth range
    ];
    const noSplitOverride = NO_ADULT_SPLIT.some(rule => {
      if (rule.groupId && rule.groupId === groupId) return true;
      if (rule.nameContains && rep.name.toUpperCase().includes(rule.nameContains.toUpperCase())) return true;
      return false;
    });

    // ── Per-model forced split (bypasses isChildren check, custom minAdultSize) ──
    // Use when productType is in NEVER_CHILDREN_TYPES but the product still needs a kids/adult split.
    // E.g. KINTAYO sambo uniform (productType='uniform') — sizes 130–190, split at 155.
    const FORCE_SPLIT: Array<{ groupId: string; minAdultSize: number; childIsChildren: boolean }> = [
      { groupId: "1040", minAdultSize: 155, childIsChildren: true },
    ];
    const forceSplitRule = FORCE_SPLIT.find(r => r.groupId === groupId);

    // Effective adult size min — may be overridden per-model
    const effectiveAdultMin = forceSplitRule ? forceSplitRule.minAdultSize : ADULT_SIZE_MIN;

    const childSizes  = sizes.filter(s => !isPureNumeric(s) || parseFloat(s) < effectiveAdultMin);
    const adultSizes  = sizes.filter(s => isPureNumeric(s) && parseFloat(s) >= effectiveAdultMin);
    const needsSplit  = (forceSplitRule != null || (isChildren && !noSplitOverride)) && adultSizes.length > 0;

    // Helper: filter a variants array to only include offers whose size is in the given set.
    // Also re-computes .images to only use pictures from offers in the allowed size range
    // so child variants show child photos and adult variants show adult photos.
    function filterVariantOffers(vars: ProductVariant[], allowedSizes: string[], rawOffers: RawOffer[]): ProductVariant[] {
      const sizeSet = new Set(allowedSizes);
      // Build per-color image map restricted to allowedSizes
      const colorImgMap = new Map<string, string[]>();
      for (const o of rawOffers) {
        const sz = getSize(o);
        if (!sz || sizeSet.has(sz)) {
          const c = o.params["Колір"] || "Стандарт";
          if (!colorImgMap.has(c)) colorImgMap.set(c, []);
          for (const pic of o.pictures) {
            if (!colorImgMap.get(c)!.includes(pic)) colorImgMap.get(c)!.push(pic);
          }
        }
      }
      return vars.map(v => {
        const filtered = (v.offers ?? []).filter(o => !o.size || sizeSet.has(o.size));
        if (filtered.length === 0 && allowedSizes.length > 0) return null;
        const prices = filtered.map(o => o.price).filter(p => p > 0);
        const oldPs  = filtered.map(o => o.oldPrice).filter((p): p is number => p != null && p > 0);
        const rawScopedImages = (colorImgMap.get(v.color) ?? []).slice(0, 8);
        const scopedImages = applyImageOverride(groupId, v.color, rawScopedImages.length > 0 ? rawScopedImages : v.images);
        return {
          ...v,
          images:   scopedImages.length > 0 ? scopedImages : v.images,
          offers:   filtered,
          price:    prices.length  ? Math.min(...prices) : v.price,
          oldPrice: oldPs.length   ? Math.min(...oldPs)  : v.oldPrice,
        };
      }).filter((v): v is ProductVariant => v !== null);
    }

    // Helper: filter raw offers to only those with size in allowed set (for availability check)
    function filterOffersBySize(offs: RawOffer[], allowedSizes: string[]): RawOffer[] {
      const sizeSet = new Set(allowedSizes);
      return offs.filter(o => { const s = getSize(o); return !s || sizeSet.has(s); });
    }

    const baseDesc = rep.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);

    // ── Parse комплектація from raw YML HTML (tags preserved) ─────────────────
    const { includes: parsedIncludes, beltStatus: parsedBeltStatus } = parseIncludesFromHTML(rep.rawDescriptionHTML);

    const buildEntry = (
      entryIsChildren: boolean,
      entrySizes: string[],
      entryVariants: ProductVariant[],
      entryGroupOffers: RawOffer[],
      idSuffix: string,
      entryImages?: string[],
    ): Product => {
      const entryCategorySlug = NON_SPORT_TYPES.has(productType)
        ? 'uncategorized'
        : normalizeCategorySlugByMeta(sportSlug, entryIsChildren);
      const entryAgeGroup = entryIsChildren
        ? (rep.params["Вікова категорія"] || "Дитячі")
        : (rep.params["Вікова категорія"] || "");
      const entryPrices = entryGroupOffers.map(o => o.price).filter(p => p > 0);
      const entryOldPrices = entryGroupOffers.map(o => o.oldPrice).filter((p): p is number => p != null && p > 0);
      const entryPrice = entryPrices.length ? Math.min(...entryPrices) : 0;
      const entryOldPrice = entryOldPrices.length ? Math.min(...entryOldPrices) : undefined;
      const entrySlug = (slug + idSuffix).slice(0, 80);

      // Variants are pre-processed (KINTAYO belt color logic applied before buildEntry is called)
      const finalVariants = entryVariants;

      return {
        id: groupId + idSuffix,
        slug: entrySlug,
        name: rep.name,
        brand: getBrand(rep),
        productType,
        sportSlug,
        categorySlug: entryCategorySlug,
        ageGroup: entryAgeGroup,
        isChildren: entryIsChildren,
        price: Number.isFinite(entryPrice) ? entryPrice : 0,
        oldPrice: entryOldPrice,
        rating: 4.8,
        reviewCount: 0,
        image: applyImageOverride(groupId, color, entryImages ?? allImages)[0] ?? "",
        images: applyImageOverride(groupId, color, entryImages ?? allImages),
        variants: finalVariants.length > 0 ? finalVariants : undefined,
        sizes: entrySizes,
        size: entrySizes[0] ?? getSize(rep),
        color,
        available: entryGroupOffers.some(getAvailability),
        forWhom: entryAgeGroup || (entryIsChildren ? "Діти" : "Дорослі та підлітки"),
        sport,
        type: "both",
        fabric: material ? `${material}${density ? `, ${density}` : ""}` : density,
        density,
        includes: parsedIncludes,
        beltStatus: parsedBeltStatus,
        care: [],
        description: baseDesc,
        judoLevel: detectJudoLevel(getBrand(rep), rep.name, sportSlug, productType, entryIsChildren),
        modelSeries: detectModelSeries(getBrand(rep), rep.name),
        isHit: false,
        isNew: false,
        relatedIds: [],
        vendorCode: rep.vendorCode,
      };
    };

    if (isKintayoBelt) {
      // ── KINTAYO belt: split by COLOR SERIES, not by size ────────────────────
      // YUKO = beginner colors (white→orange-green), entry isChildren=true
      // WAZARI = advanced colors (green→brown), entry isChildren=false
      const yukoSet   = new Set(YUKO_COLORS_ORDER);
      const wazariSet = new Set(WAZARI_COLORS_ORDER);

      const yukoOffers   = groupOffers.filter(o => yukoSet.has(normalizeBeltColor(o.params["Колір"] || "")));
      const wazariOffers = groupOffers.filter(o => wazariSet.has(normalizeBeltColor(o.params["Колір"] || "")));

      // Build sizes from each series' offers
      const seriesSizes = (offs: RawOffer[]): string[] => {
        const ss = new Set<string>();
        for (const o of offs) { const s = getSize(o); if (s) ss.add(s); }
        return Array.from(ss).sort((a, b) => { const na = parseFloat(a), nb = parseFloat(b); return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb; });
      };

      // Build variants from a subset of offers (re-run colorMap logic for that subset)
      const buildSeriesVariants = (offs: RawOffer[]): ProductVariant[] => {
        const cm = new Map<string, RawOffer[]>();
        for (const o of offs) {
          const c = o.params["Колір"] || "Стандарт";
          if (!cm.has(c)) cm.set(c, []);
          cm.get(c)!.push(o);
        }
        return Array.from(cm.entries()).map(([c, colOffers]) => {
          const sorted = sortSizes(colOffers);
          const firstOffer = sorted[0];
          const colPrices = sorted.map(o => o.price).filter(p => p > 0);
          const colOldPrices = sorted.map(o => o.oldPrice).filter((p): p is number => p != null && p > 0);
          const offerEntries: OfferEntry[] = sorted.map(o => ({
            offerId: o.id,
            size: getSize(o),
            price: o.price,
            oldPrice: o.oldPrice,
            name: o.name,
            vendorCode: o.vendorCode,
            available: getAvailability(o),
          }));
          const resolvedColorS = PRODUCT_COLOR_NAME_OVERRIDES[groupId]?.[c] ?? c;
          return {
            color: resolvedColorS,
            colorHex: PRODUCT_COLOR_HEX_OVERRIDES[groupId]?.[c] ?? colorHex(resolvedColorS),
            images: Array.from(new Set(sorted.flatMap(o => o.pictures))).slice(0, 8),
            name: firstOffer.name,
            price: colPrices.length ? Math.min(...colPrices) : undefined,
            oldPrice: colOldPrices.length ? Math.min(...colOldPrices) : undefined,
            vendorCode: firstOffer.vendorCode,
            offers: offerEntries,
          };
        });
      };

      // YUKO entry (id=groupId, isChildren=false) — belts never route to dytiachy
      // YUKO colors are beginner/children's progression but belts span all ages in the store.
      if (yukoOffers.length > 0) {
        const yukoVariants = applyKintayoBeltColorLogic(buildSeriesVariants(yukoOffers), 'YUKO');
        const yukoSizes    = seriesSizes(yukoOffers);
        const yukoImages   = Array.from(new Set(yukoOffers.flatMap(o => o.pictures))).slice(0, 8);
        products.push(buildEntry(false, yukoSizes, yukoVariants, yukoOffers, '', yukoImages.length ? yukoImages : undefined));
      }

      // WAZARI entry (id=groupId+'_adult', isChildren=false)
      if (wazariOffers.length > 0) {
        const wazariVariants = applyKintayoBeltColorLogic(buildSeriesVariants(wazariOffers), 'WAZARI');
        const wazariSizes    = seriesSizes(wazariOffers);
        const wazariImages   = Array.from(new Set(wazariOffers.flatMap(o => o.pictures))).slice(0, 8);
        products.push(buildEntry(false, wazariSizes, wazariVariants, wazariOffers, '_adult', wazariImages.length ? wazariImages : undefined));
      }
    } else if (needsSplit) {
      // ── Child entry — sizes < effectiveAdultMin ───────────────────────────────
      const childOffers = filterOffersBySize(groupOffers, childSizes);
      const childVariants = filterVariantOffers(variants, childSizes, groupOffers);
      // Representative image for the child entry: first picture from a child-size offer
      const childImages = Array.from(
        new Set(childOffers.flatMap(o => o.pictures))
      ).slice(0, 8);
      // For force-split products, use the override childIsChildren flag; otherwise true.
      const childIsChildrenFlag = forceSplitRule ? forceSplitRule.childIsChildren : true;
      if (childSizes.length > 0 && childOffers.length > 0) {
        products.push(buildEntry(childIsChildrenFlag, childSizes, childVariants, childOffers, '', childImages.length ? childImages : undefined));
      }
      // ── Adult entry — sizes ≥160 ─────────────────────────────────────────────
      const adultOffers = filterOffersBySize(groupOffers, adultSizes);
      const adultVariants = filterVariantOffers(variants, adultSizes, groupOffers);
      // Representative image for the adult entry: first picture from an adult-size offer
      const adultImages = Array.from(
        new Set(adultOffers.flatMap(o => o.pictures))
      ).slice(0, 8);
      if (adultSizes.length > 0 && adultOffers.length > 0) {
        products.push(buildEntry(false, adultSizes, adultVariants, adultOffers, '_adult', adultImages.length ? adultImages : undefined));
      }
    } else {
      // No split needed — push as-is
      const product: Product = {
        id: groupId,
        slug,
        name: rep.name,
        brand: getBrand(rep),
        productType,
        sportSlug,
        categorySlug,
        ageGroup,
        isChildren,
        price: Number.isFinite(price) ? price : 0,
        oldPrice,
        rating: 4.8,
        reviewCount: 0,
        image: allImages[0] ?? "",
        images: allImages,
        variants: variants.length > 0 ? variants : undefined,
        sizes,
        size: getSize(rep),
        color,
        available: groupOffers.some(getAvailability),
        forWhom: ageGroup || "Дорослі та діти",
        sport,
        type: "both",
        fabric: material ? `${material}${density ? `, ${density}` : ""}` : density,
        density,
        includes: parsedIncludes,
        beltStatus: parsedBeltStatus,
        care: [],
        description: baseDesc,
        judoLevel: detectJudoLevel(getBrand(rep), rep.name, sportSlug, productType, isChildren),
        modelSeries: detectModelSeries(getBrand(rep), rep.name),
        isHit: false,
        isNew: false,
        relatedIds: [],
        vendorCode: rep.vendorCode,
      };
      products.push(product);
    }
  }
  return products.sort((a, b) =>
    Number(b.available) - Number(a.available) ||
    Number((b.sizes?.length ?? 0) > 0) - Number((a.sizes?.length ?? 0) > 0) ||
    a.name.localeCompare(b.name, 'uk')
  );
}

/**
 * Re-group "flat" size offers: products where each size was exported as a
 * standalone offer (group_id === offer_id) but the size is encoded in the name,
 * e.g. "Кімоно BUDOGI Aikido, зріст 110 см" / "…, зріст 120 см" / etc.
 *
 * Strategy:
 *  1. Detect: offer.groupId === offer.id AND name contains a size marker.
 *  2. Normalize: strip the size suffix → "Кімоно BUDOGI Aikido".
 *  3. Key: vendor + "||" + normalizedName  (case-insensitive, trimmed).
 *  4. All offers that share the same key get re-assigned the same groupId
 *     (the smallest numeric id in the group, so the result is deterministic).
 */
function regroupFlatSizeOffers(offers: RawOffer[]): RawOffer[] {
  // Patterns that indicate a size embedded in the offer name.
  // Captures the full suffix to strip, e.g. ", зріст 110 см" or ", розмір 140"
  const SIZE_SUFFIX_RE = /[,\s]+(?:зріст\s*\d{2,3}(?:\s*см)?|розмір\s*\d{2,3}(?:\s*см)?|\d{3}\s*см)\s*$/i;

  // Collect candidates: flat offers with a size marker in the name
  type Candidate = { offer: RawOffer; normalizedName: string; key: string };
  const candidates: Candidate[] = [];

  for (const o of offers) {
    if (o.groupId !== o.id) continue;              // already grouped — skip
    if (!SIZE_SUFFIX_RE.test(o.name)) continue;    // no size in name — skip
    const normalizedName = o.name.replace(SIZE_SUFFIX_RE, "").trim();
    const key = (o.vendor + "||" + normalizedName).toLowerCase();
    candidates.push({ offer: o, normalizedName, key });
  }

  if (candidates.length === 0) return offers;

  // Group candidates by key → pick canonical groupId (smallest numeric id)
  const keyToCanonical = new Map<string, string>();
  const keyGroups = new Map<string, Candidate[]>();
  for (const c of candidates) {
    if (!keyGroups.has(c.key)) keyGroups.set(c.key, []);
    keyGroups.get(c.key)!.push(c);
  }
  for (const [key, group] of keyGroups) {
    if (group.length < 2) continue; // only re-group when there are ≥2 siblings
    const ids = group.map(c => c.offer.id);
    // Prefer numeric sort; fall back to string sort
    ids.sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
    });
    keyToCanonical.set(key, ids[0]);
  }

  if (keyToCanonical.size === 0) return offers;

  // Build a set of offer ids that will be re-grouped
  const toRegroup = new Map<string, string>(); // offerId → canonicalGroupId
  for (const c of candidates) {
    if (keyToCanonical.has(c.key)) {
      toRegroup.set(c.offer.id, keyToCanonical.get(c.key)!);
    }
  }

  // Return a new array with groupId patched on affected offers
  return offers.map(o => {
    if (!toRegroup.has(o.id)) return o;
    return { ...o, groupId: toRegroup.get(o.id)! };
  });
}

export async function fetchCatalog(): Promise<Product[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.products;
  try {
    const res = await fetch(YML_URL, { headers: { "Accept": "application/xml, text/xml" }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`YML fetch failed: ${res.status}`);
    const xml = await res.text();
    // Sanity check: if the response looks like HTML (e.g. DB Exception page), treat as error
    if (xml.trimStart().startsWith('<') && /<html/i.test(xml.slice(0, 200))) {
      throw new Error('YML returned HTML instead of XML (feed is down)');
    }
    const { categories, offers } = parseXML(xml);
    const regrouped = regroupFlatSizeOffers(offers);
    const products = buildProducts(categories, regrouped);
    cache = { products, fetchedAt: now };
    return products;
  } catch (err) {
    // Feed is down — serve stale in-memory cache if available
    if (cache && cache.products.length > 0) {
      console.warn('[yml-catalog] Feed error, serving stale cache:', (err as Error).message);
      return cache.products;
    }
    // Cold start with no cache — load static snapshot so the store is never empty
    try {
      const { default: snapshot } = await import('./catalog-snapshot.json', { assert: { type: 'json' } });
      console.warn('[yml-catalog] Feed error on cold start, loading snapshot fallback:', (err as Error).message);
      const products = snapshot as Product[];
      cache = { products, fetchedAt: 0 }; // fetchedAt=0 forces a retry next request
      return products;
    } catch {
      // snapshot also unavailable — throw original error
    }
    throw err;
  }
}
export function invalidateCache() { cache = null; }
