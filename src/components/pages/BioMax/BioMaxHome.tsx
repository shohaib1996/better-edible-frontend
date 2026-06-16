"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────
type BgEntry = { id: string; url: string; dark: boolean };
type LayoutName =
  | "classic"
  | "claims-hero"
  | "stacked-wide"
  | "whisper"
  | "split"
  | "oversized"
  | "bottom-heavy"
  | "minimal-top";

// ── All backgrounds ────────────────────────────────────────────────────────────
const ALL_BACKGROUNDS: BgEntry[] = [
  { id: "gold-network", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_01_gold_network-FTEtwqog4NYf6JFF7DjMc7.webp", dark: false },
  { id: "dark-glow", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_02_dark_glow-Kb3PuipVXg3sC3H9irG8T2.webp", dark: true },
  { id: "blue-frost", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_03_blue_frost-jWnLv3JaWXmL3nveTWUqUK.webp", dark: false },
  { id: "smoke-grey", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_04_smoke_grey-YnD8SrKb3eRRCi7vpGjMFF.webp", dark: true },
  { id: "emerald", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_05_emerald-CTvRebHCHACTFsyLMkodQ3.webp", dark: true },
  { id: "mol-light", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/biomax_mol_light-EGxfaZSVFsQeqfnPxw4S96.webp", dark: false },
  { id: "mol-dark", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/biomax_mol_dark-mjQeYBxmiMUEi7uCJ4gRdm.webp", dark: true },
  { id: "rose-crystal", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_06_rose_crystal-BzG9vQfV6QMGb9jHLd8JYH.webp", dark: false },
  { id: "deep-navy", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_07_deep_navy-JWLToAp9z8SrpC33u3bYi9.webp", dark: true },
  { id: "copper-mist", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_08_copper_mist-TLTRbi8uCaGnt34ejkdPdk.webp", dark: true },
  { id: "violet-dusk", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_10_violet_dusk-BdhKbj39e8mb7NzL9Yqw3S.webp", dark: true },
  { id: "teal-deep", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_11_teal_deep-J53qZHRu25hMP5VfcKF3kM.webp", dark: true },
  { id: "sand-warm", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_12_sand_warm-e8JUg2KzikVRVUSE2ty2W9.webp", dark: false },
  { id: "ice-silver", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_13_ice_silver-Nf9WQdkXWSqg9EiBXLRVhB.webp", dark: false },
  { id: "amber-nodes", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_14_amber_nodes-9J7os6AAvmXWnCPS3KYxLN.webp", dark: false },
  { id: "midnight-blue", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_15_midnight_blue-aeYPjGfXqGEMkCBvBjQJGz.webp", dark: true },
  { id: "warm-cream", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_16_warm_cream-Mh5QJyYqzSMJLWQwFVkNaH.webp", dark: false },
  { id: "forest-green", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_17_forest_green-Ue7wFRGYpJVqvS9qFHAGRD.webp", dark: true },
  { id: "lavender-mist", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_18_lavender_mist-VQrHJNkpMkGtAEHNuJjXKv.webp", dark: false },
  { id: "charcoal-smoke", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_19_charcoal_smoke-Yz8eMXJGJpVPiHkFGMfkxn.webp", dark: true },
  { id: "pale-gold", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_20_pale_gold-qJHBxjpbVxBJGMBhSBJVGQ.webp", dark: false },
  { id: "warm-peach", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_51_warm_peach-hzUrSfapjW2AvpSBxwrgac.webp", dark: false },
  { id: "dark-olive", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_52_dark_olive-RQPiR5Mh6nBBUy9PAhMhHv.webp", dark: true },
  { id: "gold-leaf", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_53_gold_leaf-Ariup6Np3JRgYcqYwfeDcd.webp", dark: true },
  { id: "pale-mint", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_54_pale_mint-TaBZpXF9WPfJQd7jyFeM76.webp", dark: false },
  { id: "deep-slate", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_55_deep_slate-RcYWRzLjnPGxmY2tjpLVRJ.webp", dark: true },
  { id: "fiery-orange", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_56_fiery_orange-TpugiCi8ZssKmRhTuNNTyD.webp", dark: true },
  { id: "champagne", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_57_champagne-GDke55o8n9HXQp7aeEa67d.webp", dark: false },
  { id: "deep-plum", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_58_deep_plum-kwuBrNkLJKWV7MNjuPKycM.webp", dark: true },
  { id: "bright-turquoise", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_59_bright_turquoise-SJnS8RJpyqLQoiVggTVuSr.webp", dark: true },
  { id: "warm-sand", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_60_warm_sand-SfALB4WtAVkLHy4E54uWXK.webp", dark: false },
  { id: "dark-maroon", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_61_dark_maroon-cu69bNGWRi6WdrqYgAUuYh.webp", dark: true },
  { id: "iridescent-pearl", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_62_iridescent_pearl-MPEJUPKmb7TXqtthVpjCBj.webp", dark: false },
  { id: "deep-teal-cloud", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_63_deep_teal_cloud-nHwTcqSWYp8RCBYuukWP8U.webp", dark: true },
  { id: "butter-yellow", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_64_butter_yellow-MqYwLfijJ67aysxriuJvU5.webp", dark: false },
  { id: "dark-graphite", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_65_dark_graphite-GBJidXvjWoqFsxZUFqcAmV.webp", dark: true },
  { id: "electric-violet", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_66_electric_violet-Li4fkfAkKTBsrbE9XtjuLj.webp", dark: true },
  { id: "rose-gold", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_81_rose_gold-ka5VLUgWy8VS9MB53Aj2cb.webp", dark: false },
  { id: "pale-steel", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_75_pale_steel-mZFAQmdH8i4RevRxRTYzu6.webp", dark: false },
  { id: "hunter-green", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_73_hunter_green-6xWZ8MZUXDA9VPrAsSj97k.webp", dark: true },
  { id: "dark-espresso", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_76_dark_espresso-mecxWZv6Usi5Ptn9RpaKPz.webp", dark: true },
  { id: "bright-coral", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_39_bright_coral-jcmHhNHHG3FekwP2qe6pos.webp", dark: true },
  { id: "pale-lavender", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_40_pale_lavender-mnubeMdWqb7u37ZiwGx8bB.webp", dark: false },
  { id: "warm-tan", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_133_warm_tan-KMvBCFN5kAXdezvCuge2r8.webp", dark: false },
  { id: "dark-charcoal", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_134_deep_charcoal-Li4fkfAkKTBsrbE9XtjuLj.webp", dark: true },
  { id: "pale-blue-mist", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_138_pale_blue_mist-cihT3YXVK89XgtziN25uVo.webp", dark: false },
  { id: "dark-moss", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_139_dark_moss-EY2LG7hpDy5XiZQzNpNp97.webp", dark: true },
  { id: "dark-cobalt", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_124_dark_cobalt-hogAKFQqQWUYHRxcEwWezM.webp", dark: true },
  { id: "pale-gold-white", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_145_pale_gold_white-Nww5WRJWZDmCNB27sSnwv5.webp", dark: false },
  { id: "deep-brown", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_169_deep_brown-2xoUYRsJ65yLAUr6RDAC8j.webp", dark: true },
  { id: "pale-cyan", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_151_pale_cyan-WD5evfLyTjtDuXJ5FRPtEe.webp", dark: false },
  { id: "dark-plum", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_142_dark_plum-Bu75wM8zeq7ZvaEzKVvZ3Q.webp", dark: true },
  { id: "pale-violet", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_159_pale_violet-6qiSyhrgz4qTu7VrW2fZ9K.webp", dark: false },
  { id: "pale-lavender2", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_127_pale_lavender-mnubeMdWqb7u37ZiwGx8bB.webp", dark: false },
  { id: "warm-peach-light", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_166_warm_peach_light-YptFcPBxVykEbmUtDJw4Z6.webp", dark: false },
  { id: "neon-blue", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_163_neon_blue-Mi6S7c4WwxkW93mU7jF5ye.webp", dark: true },
  { id: "warm-gold-smoke", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_193_warm_gold_smoke-MKazTNjHPkKRiPDvR39BZW.webp", dark: false },
  { id: "pale-indigo", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_194_pale_indigo-TNVVRTd5Zqvm38Ae5HKgMt.webp", dark: false },
  { id: "dark-ruby", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_195_dark_ruby-EhugGWuNqgVmPh86s6nv7N.webp", dark: true },
  { id: "pale-amber", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_196_pale_amber-J6tkFN24bdpEH9yhuEzGkC.webp", dark: false },
  { id: "dark-blue-smoke", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_197_dark_blue_smoke-iTCkRUJkwN6AqK8rmasGqz.webp", dark: true },
  { id: "warm-gold-light", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_198_warm_gold_light-Fi538fQrSgVaWUfyzNTKTv.webp", dark: false },
  { id: "dark-green-gold", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_199_dark_green_gold-D3AJ2tNsH9EvzKovSvgzLY.webp", dark: true },
  { id: "white-crystal", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_200_bright_white_crystal-SymfDxA5rRxmPcMjTTVB4W.webp", dark: false },
  { id: "bright-amber", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_153_bright_amber-iYUJkDPn9BnZ9GrfqJ55PJ.webp", dark: false },
  { id: "dark-pewter", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_71_dark_pewter-EzpfFKFzsZhbjRv7Tq7ebD.webp", dark: true },
  { id: "dark-slate-blue", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_171_dark_slate_blue-Xm8J3Bp3fzb6VyrPJ974jZ.webp", dark: true },
  { id: "warm-pink-haze", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_172_warm_pink_haze-nLPvvgXbqcyLTGz8RF8AEA.webp", dark: false },
  { id: "neon-green", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_173_neon_green-495xs6kMRwf2J8ULsbhyBu.webp", dark: true },
  { id: "pale-warm-grey", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_174_pale_warm_grey-d9XFaekoDbpYppxLj3wbKS.webp", dark: false },
  { id: "deep-violet-smoke", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_175_deep_violet_smoke-eVfoXkRTfJV2UgsDrLmfac.webp", dark: true },
  { id: "warm-ivory", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_176_warm_ivory-QssykjPxyGWc8SbAvcqTxu.webp", dark: false },
  { id: "dark-teal-smoke", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_177_dark_teal_smoke-McEPiMxUWvnFEFqgiLpW8F.webp", dark: true },
  { id: "bright-rose", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_178_bright_rose-WunTSLwNrSLAoaNtsDiSrv.webp", dark: false },
  { id: "dark-olive-black", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_179_dark_olive_black-WeKseqmQVBPG7uK3YWELBt.webp", dark: true },
  { id: "pale-blue-white", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_180_pale_blue_white-nixDCSZzqVcPLE98LfBbAJ.webp", dark: false },
  { id: "deep-crimson-black", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_181_deep_crimson_black-FLeWpXPvowutXVx3cmaAw3.webp", dark: true },
  { id: "warm-amber-glow", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_182_warm_amber_glow-PF9hTGfsmNjGMM7bJTB4HB.webp", dark: false },
  { id: "pale-teal-mist", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_183_pale_teal_mist-gUbSVk4LqL7rDkE577Wd4f.webp", dark: false },
  { id: "dark-gold-black", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_184_dark_gold_black-XjXz6KrvsycMQBpfjSdxis.webp", dark: true },
  { id: "deep-sapphire", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_185_deep_sapphire-fVUstAxgE9G35XEYUFVs36.webp", dark: true },
  { id: "warm-cream-gold", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_186_warm_cream_gold-JZJ7Jom3xLYnskdCmBBvwA.webp", dark: false },
  { id: "dark-purple-smoke", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_187_dark_purple_smoke-NiXgUFoWsLevvNMkdYnqY5.webp", dark: true },
  { id: "bright-cyan-white", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_188_bright_cyan_white-eqwdnqTapbjJnejteeqSSU.webp", dark: false },
  { id: "dark-copper", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_189_dark_copper-jLBT623ZeyET2WrJF6pqxn.webp", dark: true },
  { id: "bright-emerald", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_190_bright_emerald-oSPM6qEr2CGy9eDZv54aJP.webp", dark: true },
  { id: "pale-rose-white", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_191_pale_rose_white-WNcmYDxVVQ78aJ6r4Uf4fy.webp", dark: false },
  { id: "dark-teal-green", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/Mkxw7VfE2RK7jeFQcAVNeN/bg_192_dark_teal_green-ZkW74gsyrJJFL6mYaQKzDS.webp", dark: true },
];

const LAYOUTS: LayoutName[] = [
  "classic", "claims-hero", "stacked-wide", "whisper",
  "split", "oversized", "bottom-heavy", "minimal-top",
];

const CORMORANT = "'Cormorant Garamond', serif";
const DM_SANS = "'DM Sans', sans-serif";
const GOLD = "#C8975A";
const INITIAL_COUNT = 20;
const LOAD_MORE = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSlides(count: number, offset: number, bgs: BgEntry[], layouts: LayoutName[]) {
  return Array.from({ length: count }, (_, i) => ({
    bg: bgs[(offset + i) % bgs.length],
    layout: layouts[(offset + i) % layouts.length],
    key: offset + i,
  }));
}

// ── Age Gate ───────────────────────────────────────────────────────────────────
function AgeGate({ onVerified }: { onVerified: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#FAF8F4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <p style={{ fontFamily: CORMORANT, fontWeight: 500, fontSize: "1.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#0F0E0C", marginBottom: "0.5rem" }}>
        Better Edibles
      </p>
      <div style={{ width: 32, height: 1, background: GOLD, margin: "0 auto 2rem" }} />
      <h1 style={{ fontFamily: CORMORANT, fontWeight: 400, fontSize: "clamp(1.5rem, 6vw, 2.25rem)", color: "#0F0E0C", marginBottom: "1rem", lineHeight: 1.2 }}>
        Are you 21 or older?
      </h1>
      <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.8rem", color: "rgba(15,14,12,0.55)", maxWidth: 320, lineHeight: 1.7, marginBottom: "2.5rem" }}>
        You must be 21 years of age or older to enter. This site contains information about cannabis products sold legally under applicable recreational cannabis law.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={onVerified} style={{ fontFamily: DM_SANS, fontWeight: 400, fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#FAF8F4", background: "#0F0E0C", border: "none", padding: "0.9rem 2.5rem", cursor: "pointer" }}>
          Yes, I&apos;m 21+
        </button>
        <button onClick={() => { window.location.href = "https://google.com"; }} style={{ fontFamily: DM_SANS, fontWeight: 400, fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#0F0E0C", background: "none", border: "1px solid rgba(15,14,12,0.25)", padding: "0.9rem 2.5rem", cursor: "pointer" }}>
          No, Exit
        </button>
      </div>
      <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.15em", color: "rgba(15,14,12,0.35)", marginTop: "2rem", textTransform: "uppercase" }}>
        By entering you agree to our Terms of Service and Privacy Policy.<br />OLCC Licensed · Recreational Cannabis
      </p>
    </div>
  );
}

// ── Layout variants ────────────────────────────────────────────────────────────
function SlideContent({ layout, ink, sub, gold, rule }: { layout: LayoutName; ink: string; sub: string; gold: string; rule: string }) {
  switch (layout) {
    case "classic":
      return (
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(4rem, 18vw, 6.5rem)", color: ink, lineHeight: 0.88, letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: sub, marginBottom: "2.5rem" }}>Enhanced Distillate</p>
          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${gold}, transparent)`, marginBottom: "2.5rem" }} />
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1.1rem, 5vw, 1.5rem)", color: ink, lineHeight: 1.5 }}>Hits in 30 minutes.</p>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1.1rem, 5vw, 1.5rem)", color: gold, lineHeight: 1.5 }}>No weed taste.</p>
        </div>
      );
    case "claims-hero":
      return (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.52rem", letterSpacing: "0.28em", textTransform: "uppercase", color: sub, marginBottom: "3rem" }}>BIOMAX · Enhanced Distillate</p>
          <p style={{ fontFamily: CORMORANT, fontWeight: 300, fontSize: "clamp(1.8rem, 8vw, 3rem)", color: ink, lineHeight: 1.25, marginBottom: "0.5rem" }}>Hits in 30 minutes.</p>
          <p style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(1.8rem, 8vw, 3rem)", color: gold, lineHeight: 1.25 }}>No weed taste.</p>
        </div>
      );
    case "stacked-wide":
      return (
        <div style={{ textAlign: "left" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 700, fontSize: "clamp(5rem, 22vw, 8rem)", color: ink, lineHeight: 0.85, letterSpacing: "-0.04em", marginBottom: "1.5rem" }}>BIO<br />MAX</h1>
          <div style={{ height: 1, width: "100%", background: rule, marginBottom: "1.5rem" }} />
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: sub, marginBottom: "0.5rem" }}>Enhanced Distillate</p>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(0.95rem, 4vw, 1.25rem)", color: ink, lineHeight: 1.6 }}>Hits in 30 minutes. No weed taste.</p>
        </div>
      );
    case "whisper":
      return (
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 300, fontSize: "clamp(2.5rem, 10vw, 4rem)", color: ink, lineHeight: 1, letterSpacing: "0.08em", marginBottom: "2rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.25em", textTransform: "uppercase", color: sub, marginBottom: "1rem" }}>Enhanced Distillate</p>
          <div style={{ height: 1, width: 48, background: gold, margin: "0 auto 2rem" }} />
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(0.85rem, 3.5vw, 1.1rem)", color: ink, lineHeight: 1.7, opacity: 0.85 }}>Hits in 30 minutes.<br />No weed taste.</p>
        </div>
      );
    case "split":
      return (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4.5vw, 1.35rem)", color: sub, lineHeight: 1.5, marginBottom: "2rem" }}>Hits in 30 minutes.</p>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(4.5rem, 20vw, 7rem)", color: ink, lineHeight: 0.88, letterSpacing: "-0.03em", marginBottom: "2rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4.5vw, 1.35rem)", color: gold, lineHeight: 1.5, marginBottom: "2rem" }}>No weed taste.</p>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.25em", textTransform: "uppercase", color: sub }}>Enhanced Distillate</p>
        </div>
      );
    case "oversized":
      return (
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "15vh 0 12vh" }}>
          <div>
            <h1 style={{ fontFamily: CORMORANT, fontWeight: 700, fontSize: "clamp(5.5rem, 24vw, 9rem)", color: ink, lineHeight: 0.82, letterSpacing: "-0.04em", marginLeft: "-0.05em" }}>BIOMAX</h1>
          </div>
          <div>
            <div style={{ height: 1, background: rule, marginBottom: "1.25rem" }} />
            <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4vw, 1.3rem)", color: ink, lineHeight: 1.55, marginBottom: "0.25rem" }}>Hits in 30 minutes.</p>
            <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4vw, 1.3rem)", color: gold, lineHeight: 1.55 }}>No weed taste.</p>
          </div>
        </div>
      );
    case "bottom-heavy":
      return (
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 0 14vh" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(3.5rem, 16vw, 5.5rem)", color: ink, lineHeight: 0.9, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: sub, marginBottom: "1.5rem" }}>Enhanced Distillate</p>
          <div style={{ height: 1, background: `linear-gradient(to right, ${gold}, transparent)`, marginBottom: "1.5rem" }} />
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1.1rem, 4.5vw, 1.4rem)", color: ink, lineHeight: 1.5 }}>
            Hits in 30 minutes.<br /><span style={{ color: gold }}>No weed taste.</span>
          </p>
        </div>
      );
    case "minimal-top":
    default:
      return (
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "14vh 0 0" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(4rem, 18vw, 6.5rem)", color: ink, lineHeight: 0.88, letterSpacing: "-0.03em", marginBottom: "1rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase", color: sub, marginBottom: "2.5rem" }}>Enhanced Distillate</p>
          <div style={{ height: 1, width: 56, background: gold, marginBottom: "2.5rem" }} />
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4vw, 1.3rem)", color: ink, lineHeight: 1.6 }}>Hits in 30 minutes.</p>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4vw, 1.3rem)", color: gold, lineHeight: 1.6 }}>No weed taste.</p>
        </div>
      );
  }
}

// ── Single slide ───────────────────────────────────────────────────────────────
function Slide({ bg, layout, isFirst, onRetailer }: { bg: BgEntry; layout: LayoutName; isFirst: boolean; onRetailer: () => void }) {
  const dark = bg.dark;
  const ink = dark ? "#FFFFFF" : "#0F0E0C";
  const sub = dark ? "rgba(255,255,255,0.55)" : "rgba(15,14,12,0.45)";
  const rule = dark ? "rgba(255,255,255,0.18)" : "rgba(15,14,12,0.12)";
  const overlay = dark ? "rgba(0,0,0,0.50)" : "rgba(250,248,244,0.38)";

  return (
    <section style={{ position: "relative", width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", scrollSnapAlign: "start", scrollSnapStop: "always" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bg.url} alt="" loading={isFirst ? "eager" : "lazy"} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: overlay }} />
      <div style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)", position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 2, width: "min(100vw, 420px)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 2rem", boxSizing: "border-box" }}>
        {/* Retailer button */}
        <button onClick={onRetailer} style={{ position: "absolute", top: "1.5rem", right: "1.75rem", zIndex: 10, fontFamily: DM_SANS, fontWeight: 400, fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: dark ? "rgba(200,151,90,0.9)" : "rgba(200,151,90,0.95)", background: "none", border: "none", cursor: "pointer", padding: 0, textShadow: dark ? "0 1px 6px rgba(0,0,0,0.6)" : "0 1px 4px rgba(255,255,255,0.5)" }}>
          Retailer
        </button>
        {/* Better Edibles wordmark */}
        <div style={{ position: "absolute", bottom: "1.75rem", left: "1.75rem", zIndex: 10, textAlign: "left", pointerEvents: "none" }}>
          <p style={{ fontFamily: CORMORANT, fontWeight: 500, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: dark ? "rgba(200,151,90,0.85)" : "rgba(200,151,90,0.9)", lineHeight: 1.25, margin: 0, textShadow: dark ? "0 1px 6px rgba(0,0,0,0.6)" : "0 1px 4px rgba(255,255,255,0.5)" }}>
            Better<br />Edibles
          </p>
        </div>
        {/* Main content */}
        <SlideContent layout={layout} ink={ink} sub={sub} gold={GOLD} rule={rule} />
      </div>
      {/* Scroll indicator on first slide */}
      {isFirst && (
        <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.3 }}>
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${ink}, transparent)`, animation: "scrollPulse 2s ease-in-out infinite" }} />
        </div>
      )}
    </section>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function BioMaxHome() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const shuffledBgs = useMemo(() => shuffle(ALL_BACKGROUNDS), []);
  const shuffledLayouts = useMemo(() => shuffle(LAYOUTS), []);
  const [slides, setSlides] = useState(() => buildSlides(INITIAL_COUNT, 0, shuffle(ALL_BACKGROUNDS), shuffle(LAYOUTS)));
  const nextOffset = useRef(INITIAL_COUNT);
  const loading = useRef(false);

  // Check sessionStorage on mount (client-only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setVerified(sessionStorage.getItem("age_verified") === "true");
    }
  }, []);

  const onVerified = useCallback(() => {
    sessionStorage.setItem("age_verified", "true");
    setVerified(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (loading.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - clientHeight * 2) {
        loading.current = true;
        const offset = nextOffset.current;
        const more = buildSlides(LOAD_MORE, offset, shuffledBgs, shuffledLayouts);
        nextOffset.current = offset + LOAD_MORE;
        setSlides((prev) => [...prev, ...more]);
        setTimeout(() => { loading.current = false; }, 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shuffledBgs, shuffledLayouts]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {!verified && <AgeGate onVerified={onVerified} />}

      {verified && (
        <div style={{ scrollSnapType: "y mandatory", overflowY: "scroll", height: "100vh", width: "100%" }}>
          {slides.map((s, i) => (
            <Slide key={s.key} bg={s.bg} layout={s.layout} isFirst={i === 0} onRetailer={() => router.push("/store2/login")} />
          ))}
        </div>
      )}
    </>
  );
}
