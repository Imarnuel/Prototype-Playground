# Icons awaited from Figma

**None of these could be downloaded.** This environment's network policy denies
`www.figma.com:443`, so `download_assets` returns URLs that cannot be fetched.

The root agreement forbids substituting a similar-looking icon or redrawing one by
hand, so each is reserved at its exact design size by `<AssetSlot>` and renders as a
neutral placeholder until the real file lands here.

To unblock: allow `www.figma.com` in the environment's Network access, then re-run
`download_assets` on `88:8079` and drop the SVGs in with these filenames.

| File | Size | Used in | Figma node |
|---|---|---|---|
| `cellular-connection.svg` | 19.2 x 12.226 | Status bar | `I88:8080;488:57541` |
| `wifi.svg` | 17.142 x 12.328 | Status bar | `I88:8080;488:57785` |
| `battery.svg` | 27.328 x 13 | Status bar | `I88:8080;128:71949` |
| `dots-horizontal.svg` | 20 x 20 | Header overflow button | `88:8085` |
| `search-sm.svg` | 20 x 20 | Search field prefix | `I88:8088;519:2671;519:2391` |
| `filter-lines.svg` | 16 x 16 | Filter button | `I88:8089;678:31` |
| `ellipse-79.svg` | 3 x 3 | Product detail separator dot | `88:8110` |
| `grid-01.svg` | 20 x 20 | Tab bar - Dashboard | `I88:8153;2232:7411;2227:7764` |
| `cart.svg` | 20 x 17.896 | Tab bar - Sales Point (selected) | `I88:8153;2232:7413;2227:7825` |
| `menu-01.svg` | 20 x 20 | Tab bar - More | `I88:8153;2232:7414;2227:7827` |
| `shopping-cart-01.svg` | 16 x 16 | View cart button | `I88:8154;2398:7604` |

Two of these are mis-named upstream and the FILE is what matters, not the node name:
the node called `chevron-down` renders **filter-lines**, and the node called `plus`
renders **shopping-cart-01**.

Before styling any of these, check the SVG's own stroke colour — a white-stroked icon
on a light background is invisible (root agreement, fidelity rules).
