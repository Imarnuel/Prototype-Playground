/**
 * Property-level audit of every built screen against the Figma node tree.
 *
 * NOT a screenshot comparison. Every expectation below was read off a Figma NODE via
 * the plugin API — fills, strokes, stroke weight and alignment, corner radius,
 * effects, auto-layout padding and spacing, and the full type spec — and is compared
 * against the computed style of the built element.
 *
 * Two things this gets right that a naive diff does not:
 *
 *  - Compound values are compared COMPUTED TO COMPUTED. The browser serialises a
 *    gradient or shadow in its own normal form (it drops a leading 0%, a trailing
 *    100%, a default 180deg) and the production build's CSS minifier does the same,
 *    so comparing a hand-written Figma string to a computed one reports differences
 *    that are only spelling. Both sides go through the same parser instead.
 *  - Text WIDTH is deliberately not asserted. Figma reports an auto-width text node's
 *    width as an integer, and Inter's advances differ slightly between the version
 *    Figma renders and the version the project ships, so widths land within ~1.5px
 *    with no consistent sign. Every specified type property IS asserted.
 *
 * Usage: node scripts/figma-audit.mjs [url]   (default http://127.0.0.1:4173/)
 */
/* Same import as scripts/sample-motion.mjs: Playwright is the container's, not a
   project dependency, so the prototype's install stays small. */
import pw from '/opt/node-tools/node_modules/playwright/index.js';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const URL = process.argv[2] ?? 'http://127.0.0.1:4173/';

const SCALAR = [
  // --- frame -------------------------------------------------------------
  ['88:8079 screen',        '.salesPoint',            'backgroundColor', 'rgb(246, 247, 249)'],

  // --- header ------------------------------------------------------------
  ['88:8081 header',        '.salesPoint__header',    'rowGap',          '8px'],
  ['88:8082 header row',    '.salesPoint__headerRow', 'paddingLeft',     '16px'],
  ['88:8082 header row',    '.salesPoint__headerRow', 'paddingRight',    '16px'],
  ['88:8082 header row',    '.salesPoint__headerRow', 'height',          '56px'],
  ['88:8083 title',         '.salesPoint__title',     'fontSize',        '22px'],
  ['88:8083 title',         '.salesPoint__title',     'fontWeight',      '600'],
  ['88:8083 title',         '.salesPoint__title',     'lineHeight',      '28px'],
  ['88:8083 title',         '.salesPoint__title',     'letterSpacing',   '-0.64px'],
  ['88:8083 title',         '.salesPoint__title',     'color',           'rgb(20, 31, 51)'],
  ['88:8084 overflow',      '.salesPoint__overflow',  'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:8084 overflow',      '.salesPoint__overflow',  'borderRadius',    '100px'],
  ['88:8084 overflow',      '.salesPoint__overflow',  'padding',         '8px'],

  // --- search and filters ------------------------------------------------
  ['88:8086 searchFilters', '.salesPoint__searchAndFilters', 'paddingLeft',  '16px'],
  ['88:8086 searchFilters', '.salesPoint__searchAndFilters', 'rowGap',       '17px'],
  ['88:8087 search bar',    '.searchBar',             'columnGap',       '8px'],
  ['88:8088 text field',    '.textField',             'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:8088 text field',    '.textField',             'borderRadius',    '12px'],
  ['88:8088 text field',    '.textField',             'padding',         '12px'],
  ['88:8088 text field',    '.textField',             'columnGap',       '8px'],
  ['88:8088 text field',    '.textField',             'height',          '40px'],
  ['placeholder',           '.textField__input',      'fontSize',        '14px'],
  ['placeholder',           '.textField__input',      'fontWeight',      '400'],
  ['placeholder',           '.textField__input',      'lineHeight',      '20px'],
  ['placeholder',           '.textField__input',      'letterSpacing',   '-0.2px'],
  ['88:8089 filter btn',    '.filterButton',          'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:8089 filter btn',    '.filterButton',          'borderRadius',    '12px'],
  ['88:8089 filter btn',    '.filterButton',          'paddingLeft',     '12px'],

  // --- filter chips ------------------------------------------------------
  ['88:8090 filter bar',    '.filterBar',             'columnGap',       '8px'],
  ['88:8092 chip active',   ".filterChip[data-active='on']",  'backgroundColor', 'rgb(44, 74, 139)'],
  ['88:8092 chip active',   ".filterChip[data-active='on']",  'borderRadius',    '32px'],
  ['88:8092 chip active',   ".filterChip[data-active='on']",  'padding',         '8px 12px'],
  ['88:8092 chip active',   ".filterChip[data-active='on']",  'color',           'rgb(255, 255, 255)'],
  ['88:8093 chip text',     ".filterChip[data-active='on']",  'fontSize',        '14px'],
  ['88:8093 chip text',     ".filterChip[data-active='on']",  'fontWeight',      '500'],
  ['88:8093 chip text',     ".filterChip[data-active='on']",  'lineHeight',      '20px'],
  ['88:8093 chip text',     ".filterChip[data-active='on']",  'letterSpacing',   '-0.16px'],
  ['88:8094 chip off',      ".filterChip[data-active='off']", 'color',           'rgb(20, 31, 51)'],

  // --- product card ------------------------------------------------------
  ['88:8103 grid',          '.productGrid',           'columnGap',       '16px'],
  ['88:8103 grid',          '.productGrid',           'rowGap',          '16px'],
  ['88:8104 card',          '.productCard',           'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:8104 card',          '.productCard',           'borderRadius',    '12px'],
  ['88:8104 card',          '.productCard',           'paddingTop',      '8px'],
  ['88:8104 card',          '.productCard',           'paddingRight',    '6px'],
  ['88:8104 card',          '.productCard',           'paddingBottom',   '16px'],
  ['88:8104 card',          '.productCard',           'paddingLeft',     '6px'],
  ['88:8104 card',          '.productCard',           'rowGap',          '11px'],
  ['88:8105 image',         '.productCard__image',    'borderRadius',    '8px'],
  ['88:8105 image',         '.productCard__image',    'height',          '108px'],
  ['88:8106 info',          '.productCard__info',     'paddingLeft',     '4px'],
  ['88:8106 info',          '.productCard__info',     'paddingRight',    '4px'],
  ['88:8106 info',          '.productCard__info',     'rowGap',          '6px'],
  ['88:8107 name',          '.productCard__name',     'fontSize',        '16px'],
  ['88:8107 name',          '.productCard__name',     'fontWeight',      '500'],
  ['88:8107 name',          '.productCard__name',     'lineHeight',      '24px'],
  ['88:8107 name',          '.productCard__name',     'letterSpacing',   '-0.24px'],
  ['88:8107 name',          '.productCard__name',     'color',           'rgb(20, 31, 51)'],
  ['88:8108 details',       '.productCard__details',  'columnGap',       '6px'],
  ['88:8109 price',         '.productCard__price',    'fontSize',        '16px'],
  ['88:8109 price',         '.productCard__price',    'lineHeight',      '24px'],
  ['88:8109 price',         '.productCard__price',    'letterSpacing',   '-0.24px'],
  ['88:8109 price',         '.productCard__price',    'color',           'rgb(50, 60, 82)'],

  // --- view cart ---------------------------------------------------------
  ['88:8154 button',        '.viewCart',              'backgroundColor', 'rgb(44, 74, 139)'],
  ['88:8154 button',        '.viewCart',              'borderRadius',    '12px'],
  ['88:8154 button',        '.viewCart',              'padding',         '12px'],
  ['88:8154 button',        '.viewCart',              'columnGap',       '8px'],
  ['88:8154 button',        '.viewCart',              'height',          '48px'],
  ['I...7605 btn text',     '.viewCart__label',       'fontSize',        '16px'],
  ['I...7605 btn text',     '.viewCart__label',       'fontWeight',      '500'],
  ['I...7605 btn text',     '.viewCart__label',       'lineHeight',      '24px'],
  ['I...7605 btn text',     '.viewCart__label',       'letterSpacing',   'normal'],
  ['I...7605 btn text',     '.viewCart__label',       'color',           'rgb(255, 255, 255)'],

  // --- tab bar -----------------------------------------------------------
  ['88:8153 tabbar',        '.tabBar',                'paddingTop',      '8px'],
  ['88:8153 tabbar',        '.tabBar',                'paddingBottom',   '20px'],
  ['88:8153 tabbar',        '.tabBar',                'paddingLeft',     '16px'],
  ['I...7410 nav',          '.tabBar__nav',           'backgroundColor', 'rgb(255, 255, 255)'],
  ['I...7410 nav',          '.tabBar__nav',           'borderRadius',    '1000px'],
  ['I...7410 nav',          '.tabBar__nav',           'padding',         '4px'],
  ['I...7413 active item',  ".tabBar__item[data-active='on']",  'backgroundColor', 'rgb(231, 237, 249)'],
  ['I...7413 active item',  ".tabBar__item[data-active='on']",  'borderRadius',    '32px'],
  ['I...7814 active label', ".tabBar__item[data-active='on'] .tabBar__label", 'color',         'rgb(44, 74, 139)'],
  ['I...7814 active label', ".tabBar__item[data-active='on'] .tabBar__label", 'fontSize',      '11px'],
  ['I...7814 active label', ".tabBar__item[data-active='on'] .tabBar__label", 'fontWeight',    '500'],
  ['I...7814 active label', ".tabBar__item[data-active='on'] .tabBar__label", 'lineHeight',    '16px'],
  ['I...7814 active label', ".tabBar__item[data-active='on'] .tabBar__label", 'letterSpacing', '-0.2px'],
  ['I...7765 Dashboard',    '.tabBar__item:nth-child(1) .tabBar__label',      'color',         'rgb(20, 31, 51)'],
  ['I...7828 More',         '.tabBar__item:nth-child(3) .tabBar__label',      'color',         'rgb(50, 60, 82)'],
  ['I...7411 item pad',     '.tabBar__item:nth-child(1)',  'paddingTop',      '8px'],
  ['I...7411 item pad',     '.tabBar__item:nth-child(1)',  'paddingBottom',   '6px'],
  ['I...7411 item pad',     '.tabBar__item:nth-child(1)',  'paddingLeft',     '14px'],
  ['I...7413 item pad',     ".tabBar__item[data-active='on']", 'paddingLeft',  '22px'],
  ['I...7414 item pad',     '.tabBar__item:nth-child(3)',  'paddingLeft',     '24px'],
  ['I...7411 item radius',  '.tabBar__item:nth-child(1)',  'borderRadius',    '100px'],
  ['I...7411 item gap',     '.tabBar__item:nth-child(1)',  'rowGap',          '2px'],
];

const COMPOUND = [
  ['88:8088 text field',  '.textField',          'boxShadow',
    'rgb(207, 211, 216) 0px 0px 0px 1px inset, rgba(10, 13, 18, 0.05) 0px 1px 2px 0px'],
  ['88:8088 grad stroke', '.textField',          '::after background',
    'linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0) 19.71%)'],
  ['88:8089 filter btn',  '.filterButton',       'boxShadow',
    'rgb(207, 211, 216) 0px 0px 0px 1px inset, rgba(10, 13, 18, 0.05) 0px 1px 2px 0px'],
  ['88:8089 grad stroke', '.filterButton',       '::after background',
    'linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%)'],
  ['88:8094 chip off',    ".filterChip[data-active='off']", 'boxShadow',
    'rgba(37, 43, 55, 0.14) 0px 0px 0px 1px inset'],
  ['88:8104 card',        '.productCard',        'boxShadow',
    'rgba(10, 13, 18, 0.01) 0px 4px 6px 0px, rgba(10, 13, 18, 0.02) 0px 12px 16px -2px, rgba(0, 0, 0, 0.01) 0px 0px 1px 0.5px'],
  // Deliberately softer than the node (0 at 50%, 0.4 at 64.663%, 0.8 at 100%), at the
  // designer's request — see ProductCard.css.
  ['88:8113 img scrim',   '.productCard__scrim', 'backgroundImage',
    'linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.06) 70%, rgba(0, 0, 0, 0.2) 100%)'],
  ['88:8152 bottom scrim','.salesPoint .bottomScrim', 'backgroundImage',
    'linear-gradient(rgba(246, 247, 248, 0) 33.537%, rgba(255, 255, 255, 0.898) 58.748%, rgb(255, 255, 255) 122.418%)'],
  ['88:8152 blur',        '.salesPoint .bottomScrim__blur', 'backdropFilter', 'blur(8px)'],
  ['88:8153 tabbar',      '.tabBar',             'backgroundImage',
    'linear-gradient(to top, rgba(255, 255, 255, 0.498), rgba(255, 255, 255, 0))'],
  ['88:8153 tabbar blur', '.tabBar',             'backdropFilter', 'blur(4px)'],
  ['I...7410 nav',        '.tabBar__nav',        'boxShadow',
    'rgba(37, 43, 55, 0.08) 0px 0px 0px 0.75px inset, rgba(0, 0, 0, 0.1) 0px 0.5px 1px 0px, rgba(10, 13, 18, 0.08) 0px 20px 24px -4px, rgba(10, 13, 18, 0.03) 0px 8px 8px -4px'],
  ['88:8154 button',      '.viewCart',           'boxShadow',
    'rgba(10, 13, 18, 0.05) 0px 1px 2px 0px'],
  ['88:8091 fade left',   '.filterBarWrap', '::after background',
    'linear-gradient(90deg, rgba(249, 250, 251, 0) 14.545%, rgb(249, 250, 251) 97.273%)'],
];

const CART = [
  ['88:8164 cart',          '.cart',                 'backgroundColor', 'rgb(255, 255, 255)'],
  // Title bar 88:8166 — H, pad 12/16, gap 12, align MIN/CENTER
  ['88:8166 title bar',     '.cart__titleBar',       'height',          '56px'],
  ['88:8166 title bar',     '.cart__titleBar',       'padding',         '12px 16px'],
  ['88:8166 title bar',     '.cart__titleBar',       'columnGap',       '12px'],
  ['88:8167 title left',    '.cart__titleLeft',      'columnGap',       '12px'],
  ['88:8168 close',         '.cart .closeButton',    'backgroundColor', 'rgba(12, 14, 24, 0.04)'],
  ['88:8168 close',         '.cart .closeButton',    'borderRadius',    '1000px'],
  ['88:8169 title',         '.cart__title',          'fontSize',        '18px'],
  ['88:8169 title',         '.cart__title',          'fontWeight',      '600'],
  ['88:8169 title',         '.cart__title',          'lineHeight',      '24px'],
  ['88:8169 title',         '.cart__title',          'letterSpacing',   '-0.32px'],
  ['88:8169 title',         '.cart__title',          'color',           'rgb(20, 31, 51)'],
  ['88:8170 title actions', '.cart__titleActions',   'columnGap',       '20px'],
  ['88:8171 icon btn',      '.cart__iconButton',     'backgroundColor', 'rgba(12, 14, 24, 0.04)'],
  ['88:8171 icon btn',      '.cart__iconButton',     'borderRadius',    '100px'],
  ['88:8171 icon btn',      '.cart__iconButton',     'padding',         '8px'],
  // Add-customer row 88:8176 — the one OUTSIDE stroke on these screens
  ['88:8176 add cust',      '.addCustomer',          'borderRadius',    '12px'],
  ['88:8176 add cust',      '.addCustomer',          'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:8176 add cust',      '.addCustomer',          'boxShadow',       '0 0 0 2px rgba(12, 14, 24, 0.04)'],
  ['88:8176 add cust',      '.addCustomer',          'padding',         '12px'],
  ['88:8177 add left',      '.addCustomer__pick',    'columnGap',       '8px'],
  ['88:8178 avatar',        '.addCustomer__avatar',  'backgroundColor', 'rgb(252, 233, 247)'],
  ['88:8178 avatar',        '.addCustomer__avatar',  'borderRadius',    '9999px'],
  ['88:8178 avatar',        '.addCustomer__avatar',  'width',           '32px'],
  ['88:8180 add label',     '.addCustomer__label',   'fontSize',        '16px'],
  ['88:8180 add label',     '.addCustomer__label',   'fontWeight',      '500'],
  ['88:8180 add label',     '.addCustomer__label',   'lineHeight',      '24px'],
  ['88:8180 add label',     '.addCustomer__label',   'letterSpacing',   '-0.24px'],
  ['88:8180 add label',     '.addCustomer__label',   'color',           'rgb(20, 31, 51)'],
  // Line rows 88:8183 — bottom-only 1px Color/border/subtle, 20px vertical padding
  ['88:8182 lines',         '.cart__lines',          'rowGap',          'normal'],
  ['88:8183 line row',      '.cartLine',             'boxShadow',       'inset 0 -1px 0 0 rgba(37, 43, 55, 0.08)'],
  ['88:8183 line row',      '.cartLine',             'paddingTop',      '20px'],
  ['88:8183 line row',      '.cartLine',             'paddingBottom',   '20px'],
  ['88:8184 line main',     '.cartLine__main',       'columnGap',       '14px'],
  ['I...9655 line img',     '.cartLine__image',      'borderRadius',    '6px'],
  ['I...9655 line img',     '.cartLine__image',      'width',           '68px'],
  ['I...9655 line img',     '.cartLine__image',      'height',          '68px'],
  ['88:8186 line info',     '.cartLine__info',       'rowGap',          '12px'],
  ['88:8187 line name',     '.cartLine__name',       'fontSize',        '16px'],
  ['88:8187 line name',     '.cartLine__name',       'fontWeight',      '500'],
  ['88:8187 line name',     '.cartLine__name',       'lineHeight',      '24px'],
  ['88:8187 line name',     '.cartLine__name',       'letterSpacing',   '-0.24px'],
  ['88:8187 line name',     '.cartLine__name',       'color',           'rgb(20, 31, 51)'],
  // Qty field 88:8188
  ['88:8188 qty field',     '.qtyField',             'boxShadow',       'inset 0 0 0 1px rgba(37, 43, 55, 0.14)'],
  // The second, gradient stroke. Not in this frame's six rows — it is on 53 of the
  // 319 qty fields across the section, all in "Customer added", and is the same paint
  // the search field carries. Applied for coherence; see index.css and BUILD-PLAN #59.
  ['88:8267 qty ring',      '.qtyField',             '::after background',
    'linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0) 19.71%)'],
  ['88:8188 qty field',     '.qtyField',             'borderRadius',    '8px'],
  ['88:8188 qty field',     '.qtyField',             'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:8188 qty field',     '.qtyField',             'padding',         '4px 8px'],
  ['88:8188 qty field',     '.qtyField',             'columnGap',       '4px'],
  ['88:8188 qty field',     '.qtyField',             'height',          '36px'],
  // The five-row majority draws bare glyphs (#30); the CSS once named a misspelt token
  // that resolved to nothing, right only by accident (#75).
  ['88:8188 qty step',      '.qtyField__step',       'backgroundColor', 'rgba(0, 0, 0, 0)'],
  ['I...4383 qty value',    '.qtyField__value',      'fontSize',        '14px'],
  ['I...4383 qty value',    '.qtyField__value',      'fontWeight',      '400'],
  ['I...4383 qty value',    '.qtyField__value',      'lineHeight',      '20px'],
  ['I...4383 qty value',    '.qtyField__value',      'letterSpacing',   '-0.2px'],
  ['I...4383 qty value',    '.qtyField__value',      'color',           'rgb(20, 31, 51)'],
  // Trailing column 88:8189
  ['88:8189 trailing',      '.cartLine__trailing',   'rowGap',          '4px'],
  ['88:8191 price',         '.cartLine__price',      'fontSize',        '16px'],
  ['88:8191 price',         '.cartLine__price',      'fontWeight',      '500'],
  ['88:8191 price',         '.cartLine__price',      'lineHeight',      '24px'],
  ['88:8191 price',         '.cartLine__price',      'letterSpacing',   '-0.24px'],
  ['88:8191 price',         '.cartLine__price',      'color',           'rgb(20, 31, 51)'],
  ['88:8191 price',         '.cartLine__price',      'textAlign',       'center'],
  // Footer 88:8239
  ['88:8239 footer',        '.cart__actions',        'columnGap',       '8px'],
  ['88:8241 checkout',      '.cart__checkout',       'backgroundColor', 'rgb(44, 74, 139)'],
  ['88:8241 checkout',      '.cart__checkout',       'borderRadius',    '12px'],
  ['88:8241 checkout',      '.cart__checkout',       'boxShadow',       '0 1px 2px 0 rgba(10, 13, 18, 0.05)'],
  ['88:8241 checkout',      '.cart__checkout',       'padding',         '12px'],
  ['88:8241 checkout',      '.cart__checkout',       'columnGap',       '8px'],
  ['88:8241 checkout',      '.cart__checkout',       'height',          '48px'],
  ['I...7605 chk label',    '.cart__checkoutLabel',  'fontSize',        '16px'],
  ['I...7605 chk label',    '.cart__checkoutLabel',  'fontWeight',      '500'],
  ['I...7605 chk label',    '.cart__checkoutLabel',  'lineHeight',      '24px'],
  ['I...7605 chk label',    '.cart__checkoutLabel',  'letterSpacing',   'normal'],
  ['I...7605 chk label',    '.cart__checkoutLabel',  'color',           'rgb(255, 255, 255)'],
  ['88:8242 queue',         '.cart__queue',          'backgroundColor', 'rgb(231, 237, 249)'],
  ['88:8242 queue',         '.cart__queue',          'borderRadius',    '12px'],
  ['88:8242 queue',         '.cart__queue',          'boxShadow',       '0 1px 2px 0 rgba(10, 13, 18, 0.05)'],
  ['88:8242 queue',         '.cart__queue',          'padding',         '12px'],
  ['I...7613 queue label',  '.cart__queueLabel',     'fontSize',        '16px'],
  ['I...7613 queue label',  '.cart__queueLabel',     'fontWeight',      '500'],
  ['I...7613 queue label',  '.cart__queueLabel',     'lineHeight',      '24px'],
  ['I...7613 queue label',  '.cart__queueLabel',     'letterSpacing',   'normal'],
  ['I...7613 queue label',  '.cart__queueLabel',     'color',           'rgb(44, 74, 139)'],
];

const SHEET = [
  ['88:11930 scrim',      '.blanket',         'backgroundColor', 'rgba(12, 14, 24, 0.5)'],
  ['88:11930 scrim',      '.blanket',         'backdropFilter',  'blur(3px)'],
  ['88:11931 sheet',      '.sheetPanel',     'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:11931 sheet',      '.sheetPanel',     'borderRadius',    '32px'],  // node: 28 — 32 at the designer's request (BottomSheet.css)
  ['88:12133 add btn',    '.customerAdd',   'backgroundColor', 'rgb(231, 237, 249)'],
  ['88:12133 add btn',    '.customerAdd',   'borderRadius',    '12px'],
  ['88:12133 add btn',    '.customerAdd',   'boxShadow',       '0 1px 2px 0 rgba(10, 13, 18, 0.05)'],
  ['88:12133 add btn',    '.customerAdd',   'paddingLeft',     '16px'],
  ['88:12133 add btn',    '.customerAdd',   'columnGap',       '16px'],
];

const EMPTY = [
  ['88:11935 ring outer', '.emptyState__rings', 'boxShadow',       'inset 0 0 0 1px rgb(242, 242, 243)'],
  ['88:11935 ring outer', '.emptyState__rings', 'borderRadius',    '56px'],
  ['88:11936 ring mid',   '.emptyState__ring2', 'boxShadow',       'inset 0 0 0 1px rgb(223, 224, 226)'],
  ['88:11936 ring mid',   '.emptyState__ring2', 'borderRadius',    '40px'],
  ['88:11937 ring inner', '.emptyState__ring3', 'boxShadow',       'inset 0 0 0 1px rgba(37, 43, 55, 0.14)'],
  ['88:11937 ring inner', '.emptyState__ring3', 'borderRadius',    '16px'],
  ['88:11942 cta',        '.customerEmpty__cta',   'backgroundColor', 'rgb(44, 74, 139)'],
  ['88:11942 cta',        '.customerEmpty__cta',   'borderRadius',    '12px'],
];

/* Customer added — `88:8243`, which is the Cart's own Frame 5010 with the label's
   weight and tracking changed and the trailing control swapped. `88:8402` is a
   byte-identical duplicate of it; `88:8322` is the same frame plus the toast below. */
const ADDED = [
  ['88:8255 row',           '.addCustomer',          'boxShadow',       '0 0 0 2px rgba(12, 14, 24, 0.04)'],
  ['88:8255 row',           '.addCustomer',          'borderRadius',    '12px'],
  ['88:8255 row',           '.addCustomer',          'padding',         '12px'],
  ['88:8256 left',          '.addCustomer__pick',    'columnGap',       '8px'],
  ['88:8257 avatar',        '.addCustomer__avatar',  'backgroundColor', 'rgb(252, 233, 247)'],
  ['88:8257 avatar',        '.addCustomer__avatar',  'borderRadius',    '9999px'],
  ['88:8259 name',          '.addCustomer__label',   'fontSize',        '16px'],
  ['88:8259 name',          '.addCustomer__label',   'fontWeight',      '600'],
  ['88:8259 name',          '.addCustomer__label',   'lineHeight',      '24px'],
  ['88:8259 name',          '.addCustomer__label',   'letterSpacing',   '-0.32px'],
  ['88:8259 name',          '.addCustomer__label',   'color',           'rgb(20, 31, 51)'],
];

/* The toast, `88:8401`: the only difference between `88:8322` and `88:8243`. */
const TOAST = [
  ['88:8401 toast',         '.toast',                'backgroundColor', 'rgb(20, 31, 51)'],
  ['88:8401 toast',         '.toast',                'borderRadius',    '8px'],
  ['88:8401 toast',         '.toast',                'padding',         '16px'],
  ['88:8401 toast',         '.toast',                'rowGap',          '4px'],
  ['88:8401 toast',         '.toast',                'width',           '200px'],
  ['I...12156 message',     '.toast__message',       'fontSize',        '16px'],
  ['I...12156 message',     '.toast__message',       'fontWeight',      '400'],
  ['I...12156 message',     '.toast__message',       'lineHeight',      '24px'],
  ['I...12156 message',     '.toast__message',       'letterSpacing',   '-0.24px'],
  ['I...12156 message',     '.toast__message',       'color',           'rgb(255, 255, 255)'],
  ['I...12156 message',     '.toast__message',       'textAlign',       'center'],
  ['I...12156 message',     '.toast__message',       'width',           '168px'],
];

/* The order total, band `115:8774`. Collapsed `88:8639`. Not asserted, on purpose
   (BUILD-PLAN #68-#70): the expanded frame's 20px side padding and its H2 header. */
const TOTAL = [
  ['88:8714 panel',         '.cart__footer',         'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:8714 panel',         '.cart__footer',         'borderRadius',    '12px 12px 0px 0px'],
  ['88:8714 panel',         '.cart__footer',         'padding',         '12px 16px 24px 16px'],
  ['88:8714 panel',         '.cart__footer',         'boxShadow',
    '0 -2px 4px -1px #0a0d120f, 0 -4px 20px -2px #0a0d121a'],
  ['88:8715 total row',     '.orderTotal__toggle',   'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:8715 total row',     '.orderTotal__toggle',   'paddingTop',      '12px'],
  ['88:8715 total row',     '.orderTotal__toggle',   'paddingBottom',   '12px'],
  ['88:8715 total row',     '.orderTotal__toggle',   'height',          '48px'],
  ['88:8716 label group',   '.orderTotal__label',    'columnGap',       '8px'],
  ['88:8717 "Total"',       '.orderTotal__label',    'fontSize',        '16px'],
  ['88:8717 "Total"',       '.orderTotal__label',    'fontWeight',      '600'],
  ['88:8717 "Total"',       '.orderTotal__label',    'lineHeight',      '24px'],
  ['88:8717 "Total"',       '.orderTotal__label',    'letterSpacing',   '-0.32px'],
  ['88:8717 "Total"',       '.orderTotal__label',    'color',           'rgb(20, 31, 51)'],
  ['88:8719 value',         '.orderTotal__value',    'fontSize',        '16px'],
  ['88:8719 value',         '.orderTotal__value',    'fontWeight',      '600'],
  ['88:8719 value',         '.orderTotal__value',    'lineHeight',      '24px'],
  ['88:8719 value',         '.orderTotal__value',    'letterSpacing',   '-0.32px'],
  ['88:8719 value',         '.orderTotal__value',    'color',           'rgb(20, 31, 51)'],
  ['88:8718 chevron',       '.orderTotal__chevron',  'width',           '20px'],
  ['88:8718 chevron',       '.orderTotal__chevron',  'height',          '20px'],
  ['88:8720 buttons',       '.cart__actions',        'columnGap',       '8px'],
];

/* Expanded, `88:9338`. */
const TOTAL_OPEN = [
  ['88:9420 breakdown',     '.orderTotal__breakdown', 'boxShadow',      'inset 0 1px 0 0 #252b3714'],
  ['88:9420 breakdown',     '.orderTotal__breakdown', 'paddingTop',     '8px'],
  ['88:9420 breakdown',     '.orderTotal__breakdown', 'paddingBottom',  '8px'],
  ['88:9421 row',           '.orderTotal__row',      'paddingTop',      '8px'],
  ['88:9421 row',           '.orderTotal__row',      'paddingBottom',   '8px'],
  ['88:9421 row',           '.orderTotal__row',      'height',          '36px'],
  ['88:9423 "Subtotal"',    '.orderTotal__row dt',   'fontSize',        '14px'],
  ['88:9423 "Subtotal"',    '.orderTotal__row dt',   'fontWeight',      '500'],
  ['88:9423 "Subtotal"',    '.orderTotal__row dt',   'lineHeight',      '20px'],
  ['88:9423 "Subtotal"',    '.orderTotal__row dt',   'letterSpacing',   '-0.16px'],
  ['88:9423 "Subtotal"',    '.orderTotal__row dt',   'color',           'rgb(94, 106, 130)'],
  ['88:9425 value',         '.orderTotal__amount',   'fontSize',        '14px'],
  ['88:9425 value',         '.orderTotal__amount',   'fontWeight',      '600'],
  ['88:9425 value',         '.orderTotal__amount',   'lineHeight',      '20px'],
  ['88:9425 value',         '.orderTotal__amount',   'letterSpacing',   '-0.2px'],
  ['88:9425 value',         '.orderTotal__amount',   'color',           'rgb(20, 31, 51)'],
];

/* The hidden Discount row, `88:9426`, styled as the design styles it. */
const TOTAL_DISCOUNT = [
  ['88:9430 discount',      '.orderTotal__deduction', 'fontSize',       '14px'],
  ['88:9430 discount',      '.orderTotal__deduction', 'fontWeight',     '500'],
  ['88:9430 discount',      '.orderTotal__deduction', 'lineHeight',     '20px'],
  ['88:9430 discount',      '.orderTotal__deduction', 'letterSpacing',  '-0.16px'],
  ['88:9430 discount',      '.orderTotal__deduction', 'color',          'rgb(94, 106, 130)'],
];

/* Quantity sheet, `88:11532`. Not asserted, on purpose: the Measurement card's
   height — the frame's fixed 278, removed down to its rows at the designer's request. */
const QTY = [
  ['88:11612 sheet',        '.quantitySheet',          'backgroundColor', 'rgb(246, 247, 249)'],
  ['88:11612 sheet',        '.quantitySheet',          'borderRadius',    '32px'],  // node: 28 — 32 at the designer's request (BottomSheet.css)
  ['I...8087 close',        '.quantitySheet .closeButton', 'backgroundColor', 'rgb(255, 255, 255)'],
  ['I...8149 confirm',      '.modalHeader__confirm',   'backgroundColor', 'rgb(231, 237, 249)'],
  ['I...8149 confirm',      '.modalHeader__confirm',   'borderRadius',    '9999px'],
  ['I...8149 confirm',      '.modalHeader__confirm',   'boxShadow',       '0 1px 2px 0 #0a0d120d'],
  ['I...8149 confirm',      '.modalHeader__confirm',   'padding',         '10px'],
  ['I...8149 confirm',      '.modalHeader__confirm',   'width',           '40px'],
  ['I...8088 title',        '.quantitySheet .modalHeader__title', 'fontSize',      '18px'],
  ['I...8088 title',        '.quantitySheet .modalHeader__title', 'fontWeight',    '600'],
  ['I...8088 title',        '.quantitySheet .modalHeader__title', 'lineHeight',    '24px'],
  ['I...8088 title',        '.quantitySheet .modalHeader__title', 'letterSpacing', '-0.32px'],
  ['I...8088 title',        '.quantitySheet .modalHeader__title', 'color',         'rgb(20, 31, 51)'],
  ['88:11614 body',         '.quantitySheet .modalBody', 'paddingLeft',   '16px'],
  ['88:11614 body',         '.quantitySheet .modalBody', 'paddingRight',  '16px'],
  ['88:11615 body stack',   '.quantitySheet .modalBody', 'rowGap',        '24px'],
  ['88:11615 body stack',   '.quantitySheet .modalBody', 'paddingBottom', '32px'],
  ['88:11616 stepper card', '.qtyStepper',             'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:11616 stepper card', '.qtyStepper',             'borderRadius',    '16px'],
  ['88:11616 stepper card', '.qtyStepper',             'padding',         '12px'],
  ['88:11618 step',         '.qtyStepper__step',       'backgroundColor', 'rgba(12, 14, 24, 0.04)'],
  ['88:11618 step',         '.qtyStepper__step',       'borderRadius',    '1000px'],
  ['88:11618 step',         '.qtyStepper__step',       'width',           '56px'],
  ['88:11618 step',         '.qtyStepper__step',       'height',          '56px'],
  ['88:11620 count',        '.qtyStepper__value',      'fontSize',        '24px'],
  ['88:11620 count',        '.qtyStepper__value',      'fontWeight',      '600'],
  ['88:11620 count',        '.qtyStepper__value',      'lineHeight',      '28px'],
  ['88:11620 count',        '.qtyStepper__value',      'letterSpacing',   '-0.64px'],
  ['88:11620 count "10"',   '.qtyStepper__count',      'color',           'rgb(20, 31, 51)'],
  ['88:11620 count "ea"',   '.qtyStepper__unit',       'color',           'rgb(122, 133, 153)'],
  ['88:11623 measurement',  '.measurement',            'rowGap',          '8px'],
  ['88:11624 "Measurement"', '.measurement__title',    'fontSize',        '16px'],
  ['88:11624 "Measurement"', '.measurement__title',    'fontWeight',      '600'],
  ['88:11624 "Measurement"', '.measurement__title',    'lineHeight',      '20px'],
  ['88:11624 "Measurement"', '.measurement__title',    'letterSpacing',   '-0.2px'],
  ['88:11624 "Measurement"', '.measurement__title',    'color',           'rgb(94, 106, 130)'],
  ['88:11625 list',         '.measurement__list',      'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:11625 list',         '.measurement__list',      'borderRadius',    '20px'],
  ['88:11625 list',         '.measurement__list',      'paddingLeft',     '16px'],
  ['88:11625 list',         '.measurement__list',      'paddingRight',    '16px'],
  ['88:11626 row',          '.measurement__row',       'height',          '56px'],
  // The 8px gap only exists beside a VISIBLE check (hidden ones drop out of the
  // auto layout), so it lives in the check's slot: 8 + 20 on the chosen row, 0 else.
  ['88:11626 gap + check',  ".measurement__row[aria-checked='true'] .measurement__checkSlot", 'width', '28px'],
  ['88:11631 no check',     ".measurement__row[aria-checked='false'] .measurement__checkSlot", 'width', '0px'],
  ['88:11626 row',          '.measurement__row',       'boxShadow',       'inset 0 -1px 0 0 #252b3714'],
  ['88:11628 label',        '.measurement__label',     'fontSize',        '16px'],
  ['88:11628 label',        '.measurement__label',     'fontWeight',      '400'],
  ['88:11628 label',        '.measurement__label',     'lineHeight',      '24px'],
  ['88:11628 label',        '.measurement__label',     'letterSpacing',   '-0.24px'],
  ['88:11628 label',        '.measurement__label',     'color',           'rgb(20, 31, 51)'],
  ['88:11629 equivalent',   '.measurement__each',      'fontSize',        '14px'],
  ['88:11629 equivalent',   '.measurement__each',      'fontWeight',      '400'],
  ['88:11629 equivalent',   '.measurement__each',      'lineHeight',      '20px'],
  ['88:11629 equivalent',   '.measurement__each',      'letterSpacing',   '-0.2px'],
  ['88:11629 equivalent',   '.measurement__each',      'color',           'rgb(94, 106, 130)'],
];

/* Editing, `88:11647`: the caret is Color/icon/brand. */
const QTY_EDIT = [
  ['88:11738 caret',        '.qtyStepper__input',      'caretColor',      'rgb(44, 74, 139)'],
  ['88:11737 count "10"',   '.qtyStepper__input',      'color',           'rgb(20, 31, 51)'],
  ['88:11737 count "10"',   '.qtyStepper__input',      'fontSize',        '24px'],
  ['88:11737 count "10"',   '.qtyStepper__input',      'fontWeight',      '600'],
  ['88:11737 count "10"',   '.qtyStepper__input',      'letterSpacing',   '-0.64px'],
  ['88:11739 unit "ea"',    '.qtyStepper__unit',       'color',           'rgb(122, 133, 153)'],
  ['88:11735 group',        '.qtyStepper__value',      'columnGap',       '4px'],
];

/* Item details, `88:9439`: the text fields and the %/₦ switch. */
const DETAILS = [
  ['88:9556 text field',    '.detailField',            'height',          '60px'],
  ['88:9556 text field',    '.detailField',            'borderRadius',    '12px'],
  ['88:9556 text field',    '.detailField',            'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:9556 text field',    '.detailField',            'paddingLeft',     '16px'],
  ['88:9556 text field',    '.detailField',            'boxShadow',       'inset 0 0 0 1px #252b3724'],
  ['88:9556 grad stroke',   '.detailField',            '::after background',
    'linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%)'],
  ['I...9589 label',        '.detailField__label',     'fontSize',        '12px'],
  ['I...9589 label',        '.detailField__label',     'fontWeight',      '500'],
  ['I...9589 label',        '.detailField__label',     'lineHeight',      '16px'],
  ['I...9589 label',        '.detailField__label',     'color',           'rgb(122, 133, 153)'],
  ['I...9590 value',        '.detailField input',      'fontSize',        '16px'],
  ['I...9590 value',        '.detailField input',      'lineHeight',      '24px'],
  ['I...9590 value',        '.detailField input',      'color',           'rgb(20, 31, 51)'],
  ['88:9565 description',   '.detailField--tall',      'height',          '120px'],
  ['88:9559 switch',        '.segmented',              'height',          '60px'],
  ['88:9559 switch',        '.segmented',              'width',           '128px'],
  ['88:9559 switch',        '.segmented',              'borderRadius',    '12px'],
  ['88:9559 switch',        '.segmented',              'padding',         '4px'],
  ['88:9559 grad stroke',   '.segmented',              '::after background',
    'linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%)'],
  // The chosen fill is one indicator that slides under the chosen option.
  ['88:9561 "%" chosen',    '.segmented__indicator',   'height',          '52px'],
  ['88:9561 "%" chosen',    '.segmented__indicator',   'width',           '60px'],
  ['88:9561 "%" chosen',    '.segmented__indicator',   'borderRadius',    '8px'],
  ['88:9561 "%" chosen',    '.segmented__indicator',   'backgroundColor', 'rgb(248, 249, 252)'],
  ['88:9562 "%"',           ".segmented__option[aria-checked='true']", 'color', 'rgb(44, 74, 139)'],
  ['88:9562 "%"',           ".segmented__option[aria-checked='true']", 'fontWeight', '600'],
  ['88:9562 "%"',           ".segmented__option[aria-checked='true']", 'lineHeight', '20px'],
  ['88:9564 "₦"',           ".segmented__option[aria-checked='false']", 'color', 'rgb(122, 133, 153)'],
  ['88:9564 "₦"',           ".segmented__option[aria-checked='false']", 'lineHeight', '24px'],
];

/* More options, `88:15543`. The rows' trailing checks are at opacity 0 and not built. */
const MENU = [
  ['88:15543 sheet',        '.sheetPanel.moreOptions', 'backgroundColor', 'rgb(246, 247, 249)'],
  ['88:15543 sheet',        '.sheetPanel.moreOptions', 'borderRadius',    '32px'],  // node: 28 — 32 at the designer's request (BottomSheet.css)
  ['I...8087 close',        '.moreOptions .closeButton', 'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:15545 body',         '.moreOptions .modalBody', 'rowGap',          '12px'],
  ['88:15545 body',         '.moreOptions .modalBody', 'paddingBottom',   '20px'],
  ['88:15547 group',        '.moreOptions__group',     'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:15547 group',        '.moreOptions__group',     'borderRadius',    '16px'],
  ['88:15547 group',        '.moreOptions__group',     'paddingLeft',     '12px'],
  ['88:15547 group stroke', '.moreOptions__group',     'boxShadow',       'inset 0 0 0 1px rgba(37, 43, 55, 0.08)'],
  ['88:15548 row',          '.moreOptions__row',       'height',          '60px'],
  ['88:15549 row gap',      '.moreOptions__row',       'columnGap',       '12px'],
  ['88:15548 row stroke',   '.moreOptions__row',       'boxShadow',       'inset 0 -1px 0 0 rgba(37, 43, 55, 0.08)'],
  ['88:15551 label',        '.moreOptions__label',     'fontSize',        '16px'],
  ['88:15551 label',        '.moreOptions__label',     'fontWeight',      '500'],
  ['88:15551 label',        '.moreOptions__label',     'lineHeight',      '24px'],
  ['88:15551 label',        '.moreOptions__label',     'letterSpacing',   '-0.2px'],
  ['88:15551 label',        '.moreOptions__label',     'color',           'rgb(20, 31, 51)'],
];

/* Apply discount, `88:15849` (10%): the field and switch are Item details' own, so
   only what this sheet sets differently is checked here. */
const APPLY = [
  ['88:15851 body',         '.applyDiscount .modalBody', 'height',        '177px'],
  ['88:15851 body',         '.applyDiscount .modalBody', 'paddingTop',    '16px'],
  ['88:15851 body',         '.applyDiscount .modalBody', 'paddingBottom', '32px'],
  ['I...8087 close',        '.applyDiscount .closeButton', 'backgroundColor', 'rgba(12, 14, 24, 0.04)'],
  ['88:15853 field',        '.applyDiscount .detailField', 'height',      '60px'],
  ['88:15853 field',        '.applyDiscount .detailField', 'borderRadius', '12px'],
  ['I...9590 "10%"',        '.applyDiscount .detailField input', 'fontSize', '16px'],
  ['I...9590 "10%"',        '.applyDiscount .detailField input', 'letterSpacing', '-0.24px'],
  ['I...9590 "10%"',        '.applyDiscount .detailField input', 'color',  'rgb(20, 31, 51)'],
  ['88:15854 switch',       '.applyDiscount .segmented', 'width',         '128px'],
  ['88:15854 switch',       '.applyDiscount .segmented', 'height',        '60px'],
  ['88:15857 "%" chosen',   ".applyDiscount .segmented__option[aria-checked='true']", 'fontWeight', '500'],
  ['88:15857 "%" chosen',   ".applyDiscount .segmented__option[aria-checked='true']", 'lineHeight', '24px'],
  ['88:15857 "%" chosen',   ".applyDiscount .segmented__option[aria-checked='true']", 'letterSpacing', '-0.2px'],
  ['88:15857 "%" chosen',   ".applyDiscount .segmented__option[aria-checked='true']", 'color', 'rgb(44, 74, 139)'],
  ['88:15859 "₦"',          ".applyDiscount .segmented__option[aria-checked='false']", 'fontWeight', '400'],
  ['88:15859 "₦"',          ".applyDiscount .segmented__option[aria-checked='false']", 'letterSpacing', '-0.32px'],
  ['88:15859 "₦"',          ".applyDiscount .segmented__option[aria-checked='false']", 'color', 'rgb(122, 133, 153)'],
];

/* Checkout `88:12450` (cash), from its nodes. */
const CHECKOUT = [
  ['88:12454 total',        '.checkout__total',        'fontSize',        '40px'],
  ['88:12454 total',        '.checkout__total',        'fontWeight',      '600'],
  ['88:12454 total',        '.checkout__total',        'lineHeight',      '36px'],
  ['88:12454 total',        '.checkout__total',        'letterSpacing',   '-0.72px'],
  ['88:12458 breakdown',    '.checkout__breakdown',    'borderRadius',    '12px'],
  ['88:12458 breakdown',    '.checkout__breakdown',    'boxShadow',       'inset 0 0 0 1px rgba(37, 43, 55, 0.08)'],
  ['88:12458 breakdown',    '.checkout__breakdown',    'padding',         '4px 16px'],
  ['88:12461 "Subtotal"',   '.checkout__row dt',       'fontSize',        '14px'],
  ['88:12461 "Subtotal"',   '.checkout__row dt',       'fontWeight',      '500'],
  ['88:12461 "Subtotal"',   '.checkout__row dt',       'color',           'rgb(50, 60, 82)'],
  ['88:12494 method card',  '.checkout__methodCard',   'backgroundColor', 'rgb(246, 247, 249)'],
  ['88:12494 method card',  '.checkout__methodCard',   'borderRadius',    '16px'],
  ['88:12495 row',          '.checkout__methodRow',    'height',          '56px'],
  ['88:12497 label',        '.checkout__methodLabel',  'fontWeight',      '500'],
  ['88:12497 label',        '.checkout__methodLabel',  'letterSpacing',   '-0.24px'],
  ['88:12499 "Cash"',       '.checkout__valueText',    'fontWeight',      '400'],
  ['88:12499 "Cash"',       '.checkout__valueText',    'letterSpacing',   '-0.2px'],
  ['88:12513 amount',       '.checkout .detailField',  'height',          '60px'],
  ['I...8135 Pay',          '.payButton',              'backgroundColor', 'rgb(44, 74, 139)'],
  ['I...8135 Pay',          '.payButton',              'borderRadius',    '12px'],
  ['I...7605 Pay label',    '.payButton',              'color',           'rgb(255, 255, 255)'],
  ['I...7605 Pay label',    '.payButton',              'fontSize',        '16px'],
  ['I...7605 Pay label',    '.payButton',              'lineHeight',      '24px'],
];

/* Pay disabled, `88:12595`. */
const CHECKOUT_OFF = [
  ['I...8135 Pay disabled', '.payButton',              'backgroundColor', 'rgba(12, 14, 24, 0.02)'],
  ['I...7813 "Pay"',        '.payButton',              'color',           'rgb(158, 164, 179)'],
];

/* Select payment method `88:14105` and Select bank `88:14794`. */
const PICKERS = [
  ['88:14109 row',          '.methodPicker__row',      'height',          '56px'],
  ['88:14109 row stroke',   '.methodPicker__row',      'boxShadow',       'inset 0 -1px 0 0 rgba(37, 43, 55, 0.08)'],
  ['88:14111 icon gap',     '.methodPicker__lead',     'columnGap',       '12px'],
  ['88:14113 "Cash"',       '.methodPicker__label',    'fontSize',        '16px'],
  ['88:14113 "Cash"',       '.methodPicker__label',    'fontWeight',      '400'],
  ['88:14113 "Cash"',       '.methodPicker__label',    'letterSpacing',   '-0.24px'],
];
const BANKS = [
  ['88:14797 search',       '.bankPicker__search',     'borderRadius',    '8px'],
  ['88:14797 search',       '.bankPicker__search',     'height',          '40px'],
  ['88:14799 row',          '.bankPicker__row',        'paddingTop',      '12px'],
  ['88:14801 logo',         '.bankPicker__logo',       'width',           '40px'],
  ['88:14807 name',         '.bankPicker__name',       'fontWeight',      '500'],
  ['88:14807 name',         '.bankPicker__name',       'letterSpacing',   '-0.24px'],
  ['88:14809 number',       '.bankPicker__sub',        'fontSize',        '14px'],
  ['88:14809 number',       '.bankPicker__sub',        'color',           'rgb(94, 106, 130)'],
  ['88:14808 gap',          '.bankPicker__sub',        'columnGap',       '6px'],
];

/* Transaction success `88:8723` and the receipt screen `88:8735`. */
const SUCCESS = [
  ['88:8726 icon',          '.saleSuccess__icon',      'backgroundColor', 'rgb(3, 140, 78)'],
  ['88:8726 icon',          '.saleSuccess__icon',      'width',           '72px'],
  ['88:8728 line',          '.saleSuccess__text',      'fontSize',        '20px'],
  ['88:8728 line',          '.saleSuccess__text',      'fontWeight',      '600'],
  ['88:8728 line',          '.saleSuccess__text',      'letterSpacing',   '-0.48px'],
];
const RECEIPT = [
  ['88:8742 card',          '.receipt',                'borderRadius',    '4px'],
  ['88:8742 card stroke',   '.receipt',                'boxShadow',       'inset 0 0 0 6px rgba(37, 43, 55, 0.08)'],
  ['88:8761 total',         '.receipt__total',         'fontSize',        '30.632px'],
  ['88:8766 row',           '.receipt__row',           'fontSize',        '11.487px'],
  ['88:8741 New sale',      '.receiptScreen__newSale', 'color',           'rgb(44, 74, 139)'],
  ['88:8741 New sale',      '.receiptScreen__newSale', 'fontSize',        '14px'],
  ['I...30556 Share',       '.receiptScreen__action',  'backgroundColor', 'rgb(231, 237, 249)'],
  ['I...30556 Share',       '.receiptScreen__action',  'color',           'rgb(44, 74, 139)'],
  ['88:8851 footer',        '.receiptScreen__footer',  'boxShadow',       'rgba(0, 0, 0, 0.08) 0px -4px 8px 0px'],
];

const browser = await pw.chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
await page.goto(URL + '?dev=1', { waitUntil: 'networkidle' });
await page.waitForSelector('.productCard');
/* Corner smoothing renders each radius x1.6 under a superellipse (index.css). The
   nodes hold the literal radius, so compare against that with smoothing off. */
await page.evaluate(() => document.documentElement.setAttribute('data-corner-smoothing', 'off'));

const pick = async (label) => {
  await page.evaluate(() => { if (!document.querySelector('.devbar__panel')) document.querySelector('.devbar__handle').click(); });
  await page.waitForTimeout(400);
  await page.evaluate((x) => [...document.querySelectorAll('.devbar__item')].find((y) => y.textContent.trim() === x).click(), label);
  await page.waitForTimeout(900);
};

/* Paints two gradients at the same size and reports the largest per-channel
   difference, so "are these the same value?" is answered by pixels, not by text. */
const pixelDelta = async (a, c) => {
  const probe = await browser.newPage({ viewport: { width: 200, height: 160 } });
  await probe.setContent(`<body style="margin:0;background:#fff">
    <div id="a" style="width:160px;height:120px;background:${a}"></div>
    <div id="b" style="width:160px;height:120px;background:${c}"></div></body>`);
  const [A, B] = [await probe.locator('#a').screenshot({ type: 'png' }), await probe.locator('#b').screenshot({ type: 'png' })];
  const raw = async (buf) => {
    const img = await probe.evaluate(async (b64) => {
      const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
      const cv = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = cv.getContext('2d');
      ctx.drawImage(bmp, 0, 0);
      return [...ctx.getImageData(0, 0, bmp.width, bmp.height).data];
    }, buf.toString('base64'));
    return img;
  };
  const [ra, rb] = [await raw(A), await raw(B)];
  let max = 0;
  for (let i = 0; i < ra.length; i++) max = Math.max(max, Math.abs(ra[i] - rb[i]));
  await probe.close();
  return { max, samples: ra.length };
};

/* Queued orders, band `170:8988`: the list `88:16280` (card `88:16283`, Recall disabled
   `88:16378`), a chosen card `88:16430` with Recall enabled `88:16525`, the row menu
   `88:16379`, the empty sheet `88:16251`, the queued toast `88:16028`. */
const QUEUE = [
  ['88:16280 sheet',        '.queuedOrders',           'backgroundColor', 'rgb(246, 247, 249)'],
  ['88:16283 card',         '.queueCard',              'borderRadius',    '16px'],
  ['88:16283 card stroke',  '.queueCard',              '::after boxShadow', 'inset 0 0 0 0.66px rgba(37, 43, 55, 0.08)'],
  ['88:16284 top',          '.queueCard__top',         'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:16285 top',          '.queueCard__top',         'padding',         '12px'],
  ['88:16285 rule',         '.queueCard__top',         '::after backgroundColor', 'rgba(37, 43, 55, 0.08)'],
  ['88:16286 summary',      '.queueCard__summary',     'rowGap',          '4px'],
  ['88:16287 name',         '.queueCard__name',        'fontSize',        '16px'],
  ['88:16287 name',         '.queueCard__name',        'fontWeight',      '500'],
  ['88:16287 name',         '.queueCard__name',        'letterSpacing',   '-0.24px'],
  ['88:16287 name',         '.queueCard__name',        'color',           'rgb(20, 31, 51)'],
  ['88:16289 items',        '.queueCard__items',       'fontSize',        '14px'],
  ['88:16289 items',        '.queueCard__items',       'lineHeight',      '20px'],
  ['88:16289 items',        '.queueCard__items',       'letterSpacing',   '-0.2px'],
  ['88:16289 items',        '.queueCard__items',       'color',           'rgb(94, 106, 130)'],
  ['88:16290 dot',          '.queueCard__dot',         'backgroundColor', 'rgb(94, 106, 130)'],
  ['88:16290 dot',          '.queueCard__dot',         'width',           '2px'],
  ['88:16295 total',        '.queueCard__total',       'fontWeight',      '600'],
  ['88:16295 total',        '.queueCard__total',       'letterSpacing',   '-0.32px'],
  ['88:16296 bottom',       '.queueCard__time',        'padding',         '12px'],
  ['88:16297 time row',     '.queueCard__time',        'columnGap',       '6px'],
  ['88:16299 time',         '.queueCard__timeText',    'color',           'rgb(94, 106, 130)'],
  ['88:16299 time',         '.queueCard__timeText',    'letterSpacing',   '-0.2px'],
  ['88:16378 Recall off',   '.recallButton',           'backgroundColor', 'rgb(207, 211, 216)'],
  ['88:16378 Recall off',   '.recallButton',           'color',           'rgb(158, 164, 179)'],
  ['88:16378 Recall',       '.recallButton',           'borderRadius',    '12px'],
  ['88:16378 Recall',       '.recallButton',           'padding',         '12px 32px'],
  ['88:16378 footer',       '.queuedOrders .modalFooter', 'padding',      '16px 16px 40px 16px'],
];
const QUEUE_CHOSEN = [
  ['88:16430 card stroke',  '.queueCard[data-chosen="on"]', '::after boxShadow', 'inset 0 0 0 1px rgb(44, 74, 139)'],
  ['88:16430 card',         '.queueCard[data-chosen="on"]', 'backgroundColor', 'rgb(240, 242, 245)'],
  ['88:16525 Recall',       '.recallButton',           'backgroundColor', 'rgb(44, 74, 139)'],
  ['88:16525 Recall',       '.recallButton',           'color',           'rgb(255, 255, 255)'],
  ['88:16525 Recall',       '.recallButton',           'boxShadow',       '0 1px 2px 0 #0a0d120d'],
];
const QUEUE_MENU = [
  ['88:16379 menu',         '.rowMenu',                'backgroundColor', 'rgb(255, 255, 255)'],
  ['88:16379 menu',         '.rowMenu',                'borderRadius',    '8px'],
  ['88:16379 menu',         '.rowMenu',                'padding',         '8px 0px'],
  ['88:16379 menu stroke',  '.rowMenu',                'boxShadow',       'inset 0 0 0 1px rgba(37, 43, 55, 0.14), 0px 4px 6px 0px #0a0d1208, 0px 12px 16px -2px #0a0d1214, 0px 0px 1px 0.5px #00000008'],
  ['I806:2043 item',        '.rowMenu__item',          'padding',         '10px 12px'],
  ['I806:2043 item',        '.rowMenu__item',          'columnGap',       '12px'],
  ['I899:2997 Delete',      '.rowMenu__label',         'color',           'rgb(193, 38, 26)'],
  ['I899:2997 Delete',      '.rowMenu__label',         'fontSize',        '14px'],
];
const QUEUE_EMPTY = [
  ['88:16253 body',         '.queuedOrders .modalBody', 'padding',        '16px 16px 48px 16px'],
  ['88:16253 body',         '.queueEmpty',             'rowGap',          '16px'],
  ['88:16254 ring outer',   '.queueEmpty .emptyState__rings', 'boxShadow', 'inset 0 0 0 1px rgb(242, 242, 243)'],
  ['88:16259 title',        '.queueEmpty .emptyState__title', 'fontSize', '18px'],
  ['88:16259 title',        '.queueEmpty .emptyState__title', 'fontWeight', '600'],
  ['88:16260 body text',    '.queueEmpty .emptyState__body', 'width',     '322px'],
];
const QUEUE_TOAST = [
  ['88:16028 pill',         '.toast',                  'backgroundColor', 'rgb(20, 31, 51)'],
  ['88:16028 pill',         '.toast',                  'borderRadius',    '9999px'],
  ['88:16028 pill',         '.toast',                  'padding',         '14px 12px'],
  ['88:16028 pill',         '.toast',                  'columnGap',       '4px'],
  ['88:16028 pill',         '.toast',                  'boxShadow',       '0px 4px 8px -2px rgba(10, 13, 18, 0.3), 0px 2px 4px -1px rgba(10, 13, 18, 0.16)'],
  ['I4381:26900 label',     '.toast__message',         'fontSize',        '14px'],
  ['I4381:26900 label',     '.toast__message',         'fontWeight',      '500'],
  ['I4381:26900 label',     '.toast__message',         'letterSpacing',   '-0.16px'],
  ['I4381:26899 label box', '.toast__message',         'padding',         '0px 8px'],
];

const run = async (name, checks) => {
  const rows = await page.evaluate((checks) => {
    const probe = document.createElement('div');
    document.body.appendChild(probe);
    const norm = (prop, v) => { probe.style[prop] = ''; probe.style[prop] = v; return getComputedStyle(probe)[prop]; };
    const COMPOUND = ['boxShadow', 'backdropFilter', 'borderRadius', 'backgroundImage'];
    return checks.map(([label, sel, prop, want]) => {
      const el = document.querySelector(sel);
      if (!el) return { label, sel, prop, want, got: 'NO SUCH ELEMENT' };
      if (prop.startsWith('::after ') && prop !== '::after background') {
        const p = prop.slice(8); const cs = getComputedStyle(el, '::after');
        return { label, sel, prop, want: COMPOUND.includes(p) || p.endsWith('Color') ? norm(p, want) : want, got: cs.content === 'none' ? 'NO ::after' : cs[p] };
      }
      if (prop === '::after background') {
        const cs = getComputedStyle(el, '::after');
        return { label, sel, prop, want: norm('backgroundImage', want), got: cs.content === 'none' ? 'NO ::after' : cs.backgroundImage };
      }
      const cs = getComputedStyle(el);
      const shorthand = () => {
        const [t, r, b, l] = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];
        if (t === r && r === b && b === l) return t;
        if (t === b && r === l) return `${t} ${r}`;
        return `${t} ${r} ${b} ${l}`;
      };
      const got = prop === 'padding' ? shorthand() : cs[prop];
      return { label, sel, prop, want: COMPOUND.includes(prop) ? norm(prop, want) : want, got };
    });
  }, checks);
  let fail = 0;
  for (const r of rows) {
    if (r.got === r.want) continue;
    /* A gradient can be the same value spelled two ways: the production build's CSS
       minifier drops a stop's redundant leading 0% and trailing 100%, which the
       browser then echoes back in its own normal form. String inequality is not
       evidence of a visual difference, so paint both and compare pixels before
       calling it a finding. */
    if (/gradient/.test(r.want) && /gradient/.test(r.got)) {
      const delta = await pixelDelta(r.want, r.got);
      if (delta.max <= 1) {
        console.log(`same  ${r.label}  [${r.prop}]  spelled differently by the minifier, max channel delta ${delta.max}/255 over ${delta.samples} samples`);
        continue;
      }
      fail++;
      console.log(`DIFF  ${r.label}  [${r.prop}]  ${r.sel}  max channel delta ${delta.max}/255`);
    } else {
      fail++;
      console.log(`DIFF  ${r.label}  [${r.prop}]  ${r.sel}`);
    }
    console.log(`        figma: ${r.want}`);
    console.log(`        built: ${r.got}`);
  }
  console.log(`${name.padEnd(22)} ${String(checks.length).padStart(3)} properties, ${fail} differ`);
  return fail;
};

let fails = 0;
fails += await run('Sales Point scalar', SCALAR);
fails += await run('Sales Point compound', COMPOUND);
await pick('Cart: fill with 4 lines');
fails += await run('Cart', CART);
await pick('Select customer');
fails += await run('Select customer', SHEET);
await pick('Select customer: empty');
fails += await run('Select customer empty', EMPTY);
await pick('Customer added');
fails += await run('Customer added', ADDED);
await pick('Customer added: toast');
fails += await run('Customer added toast', TOAST);
await pick('Cart: fill with 4 lines');
if (await page.evaluate(() => document.querySelector('.orderTotal__toggle').getAttribute('aria-expanded')) === 'true') {
  await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
  await page.waitForTimeout(700);
}
fails += await run('Order total', TOTAL);
await page.evaluate(() => document.querySelector('.orderTotal__toggle').click());
await page.waitForTimeout(700);
fails += await run('Order total open', TOTAL_OPEN);
await pick('Cart: total expanded');
fails += await run('Order total discount', TOTAL_DISCOUNT);
await pick('Quantity sheet');
fails += await run('Quantity sheet', QTY);
await pick('Quantity sheet: editing');
fails += await run('Quantity sheet editing', QTY_EDIT);
await pick('Item details: discount applied');
fails += await run('Item details', DETAILS);
await pick('More options');
fails += await run('More options', MENU);
await pick('Apply discount: 10%');
fails += await run('Apply discount', APPLY);
await pick('Checkout: cash');
fails += await run('Checkout', CHECKOUT);
await pick('Checkout: Pay disabled');
fails += await run('Checkout Pay disabled', CHECKOUT_OFF);
await pick('Select payment method');
fails += await run('Select payment method', PICKERS);
await pick('Select bank');
fails += await run('Select bank', BANKS);
await pick('Transaction success');
fails += await run('Transaction success', SUCCESS);
await pick('Receipt: cash');
fails += await run('Receipt', RECEIPT);
await pick('Queued orders');
fails += await run('Queued orders', QUEUE);
await page.evaluate(() => document.querySelector('.queueCard__choose').click());
await page.waitForTimeout(400);
fails += await run('Queued orders: chosen', QUEUE_CHOSEN);
await page.evaluate(() => document.querySelector('.queueCard__more').click());
await page.waitForTimeout(450);
fails += await run('Row menu', QUEUE_MENU);
await page.keyboard.press('Escape');
await pick('Queued orders: empty');
fails += await run('Queued orders: empty', QUEUE_EMPTY);
await pick('Order has been queued: toast');
fails += await run('Queued toast', QUEUE_TOAST);

const total = SCALAR.length + COMPOUND.length + CART.length + SHEET.length + EMPTY.length + ADDED.length + TOAST.length
  + TOTAL.length + TOTAL_OPEN.length + TOTAL_DISCOUNT.length + QTY.length + QTY_EDIT.length + DETAILS.length
  + MENU.length + APPLY.length + CHECKOUT.length + CHECKOUT_OFF.length + PICKERS.length + BANKS.length
  + SUCCESS.length + RECEIPT.length + QUEUE.length + QUEUE_CHOSEN.length + QUEUE_MENU.length + QUEUE_EMPTY.length
  + QUEUE_TOAST.length;
console.log('-'.repeat(60));
console.log(`${total} properties checked against Figma nodes, ${fails} differ`);
await browser.close();
if (fails) process.exitCode = 1;
